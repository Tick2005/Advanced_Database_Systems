const fs = require('fs');
const path = require('path');

function readEjson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return EJSON.parse(content);
}

function repoRoot() {
  return path.resolve(__dirname, '..', '..');
}

function main() {
  const root = repoRoot();
  const mongoDir = path.join(root, 'backend', 'src', 'main', 'resources', 'db', 'mongodb');

  const collectionsDef = readEjson(path.join(mongoDir, 'collections.json'));
  const indexesDef = readEjson(path.join(mongoDir, 'indexes.json'));
  const seedDef = readEjson(path.join(mongoDir, 'seed.json'));

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || collectionsDef.database || indexesDef.database || seedDef.database || 'hotel';

  const client = new Mongo(uri);
  const db = client.getDB(dbName);

  const existingCollections = new Set(db.getCollectionNames());
  let createdCollections = 0;
  for (const item of collectionsDef.collections || []) {
    if (!existingCollections.has(item.name)) {
      db.createCollection(item.name);
      createdCollections += 1;
      existingCollections.add(item.name);
    }
  }

  let createdIndexes = 0;
  for (const idx of indexesDef.indexes || []) {
    db.getCollection(idx.collection).createIndex(idx.keys, idx.options || {});
    createdIndexes += 1;
  }

  let upsertedDocs = 0;
  for (const [collectionName, docs] of Object.entries(seedDef.documents || {})) {
    const col = db.getCollection(collectionName);
    for (const doc of docs) {
      if (doc && doc._id !== undefined) {
        col.replaceOne({ _id: doc._id }, doc, { upsert: true });
      } else if (doc && doc.hotel_id) {
        col.replaceOne({ hotel_id: doc.hotel_id }, doc, { upsert: true });
      } else {
        col.insertOne(doc);
      }
      upsertedDocs += 1;
    }
  }

  print('Mongo setup completed');
  print(`- URI: ${uri}`);
  print(`- Database: ${dbName}`);
  print(`- Collections created: ${createdCollections}`);
  print(`- Indexes applied: ${createdIndexes}`);
  print(`- Seed docs upserted/inserted: ${upsertedDocs}`);
}

main();
