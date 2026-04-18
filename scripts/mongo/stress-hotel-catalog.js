const fs = require('fs');
const path = require('path');

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function avg(values) {
  if (!values.length) return 0;
  const total = values.reduce((sum, v) => sum + v, 0);
  return total / values.length;
}

function toIso(date) {
  return new Date(date).toISOString();
}

function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'hotel';
  const iterations = Number(process.env.STRESS_ITERATIONS || '5000');
  const outputPath = process.env.STRESS_OUTPUT_PATH || path.resolve(__dirname, '..', '..', 'docs', 'architecture', 'hotel-catalog-stress-result.json');

  const client = new Mongo(uri);
  const db = client.getDB(dbName);
  const col = db.getCollection('hotel_catalogs');

  const baseFilter = { is_active: true };
  const totalActive = col.countDocuments(baseFilter);
  if (totalActive === 0) {
    throw new Error('No active documents in hotel_catalogs. Run seed script first.');
  }

  const cities = col.distinct('city', baseFilter).filter(Boolean);
  const amenities = col.distinct('amenities', baseFilter).filter(Boolean);

  if (!cities.length || !amenities.length) {
    throw new Error('Missing city or amenities data for stress test.');
  }

  const latenciesMs = [];
  let totalMatched = 0;
  const startedAt = new Date();

  for (let i = 0; i < iterations; i += 1) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const amenity = amenities[Math.floor(Math.random() * amenities.length)];

    const query = {
      city,
      is_active: true,
      amenities: amenity
    };

    const t0 = Date.now();
    const docs = col.find(query, {
      projection: { _id: 0, hotel_id: 1, hotel_name: 1, city: 1, amenities: 1 }
    }).limit(20).toArray();
    const t1 = Date.now();

    latenciesMs.push(t1 - t0);
    totalMatched += docs.length;
  }

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - startedAt.getTime();

  const report = {
    name: 'hotel-catalog-read-stress',
    startedAt: toIso(startedAt),
    endedAt: toIso(endedAt),
    durationMs,
    database: dbName,
    collection: 'hotel_catalogs',
    iterations,
    dataset: {
      totalActive,
      cityCount: cities.length,
      amenityCount: amenities.length
    },
    metrics: {
      totalMatched,
      avgLatencyMs: Number(avg(latenciesMs).toFixed(3)),
      minLatencyMs: Math.min(...latenciesMs),
      p50LatencyMs: percentile(latenciesMs, 50),
      p95LatencyMs: percentile(latenciesMs, 95),
      p99LatencyMs: percentile(latenciesMs, 99),
      maxLatencyMs: Math.max(...latenciesMs)
    }
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

  print('Hotel catalog stress test completed');
  print(`- Iterations: ${iterations}`);
  print(`- p95 latency (ms): ${report.metrics.p95LatencyMs}`);
  print(`- p99 latency (ms): ${report.metrics.p99LatencyMs}`);
  print(`- Output: ${outputPath}`);
}

main();
