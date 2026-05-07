export function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 }
    );
  });
}

export function distanceKm(from, to) {
  if (!from || !to) return Number.POSITIVE_INFINITY;

  const fromLat = Number(from.latitude);
  const fromLng = Number(from.longitude);
  const toLat = Number(to.latitude);
  const toLng = Number(to.longitude);

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }

  const rad = Math.PI / 180;
  const deltaLat = (toLat - fromLat) * rad;
  const deltaLng = (toLng - fromLng) * rad;
  const lat1 = fromLat * rad;
  const lat2 = toLat * rad;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeBlendedScore(rating, distanceKmValue) {
  const normalizedRating = clamp(Number(rating || 0) / 5, 0, 1);
  const distanceScore = Number.isFinite(distanceKmValue)
    ? 1 / (1 + Math.max(0, distanceKmValue))
    : 0;

  // Prioritize quality while still rewarding closer locations.
  return normalizedRating * 0.72 + distanceScore * 0.28;
}

export function sortRoomsByProximityAndRating(rooms, branches, location, allowLocation = true) {
  const branchById = new Map((branches || []).map((branch) => [branch.id, branch]));
  const canUseLocation = Boolean(allowLocation && location);

  return [...(rooms || [])].sort((left, right) => {
    const leftRating = Number(left.averageRating || 0);
    const rightRating = Number(right.averageRating || 0);

    if (!canUseLocation) {
      if (leftRating !== rightRating) {
        return rightRating - leftRating;
      }
      return Number(right.rate || 0) - Number(left.rate || 0);
    }

    const leftBranch = branchById.get(left.branchId);
    const rightBranch = branchById.get(right.branchId);
    const leftDistance = distanceKm(location, leftBranch ? { latitude: leftBranch.latitude, longitude: leftBranch.longitude } : null);
    const rightDistance = distanceKm(location, rightBranch ? { latitude: rightBranch.latitude, longitude: rightBranch.longitude } : null);
    const leftScore = computeBlendedScore(leftRating, leftDistance);
    const rightScore = computeBlendedScore(rightRating, rightDistance);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    if (leftRating !== rightRating) {
      return rightRating - leftRating;
    }

    return Number(right.rate || 0) - Number(left.rate || 0);
  });
}

export function saveLocationToStorage(loc) {
  try { localStorage.setItem("user_location", JSON.stringify(loc)); } catch(e) {}
}
export function loadLocationFromStorage() {
  try {
    const s = localStorage.getItem("user_location");
    return s ? JSON.parse(s) : null;
  } catch(e) { return null; }
}