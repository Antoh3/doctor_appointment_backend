function generateRandomLocation() {
    // Generate random latitude and longitude within reasonable bounds
    const latitude = Math.random() * 180 - 90; // Between -90 and 90 degrees
    const longitude = Math.random() * 360 - 180; // Between -180 and 180 degrees
    return [longitude, latitude];
  }
  
  function calculateDistance(location1, location2) {
    // Implement distance calculation logic (e.g., using the Haversine formula)
    // This is a simplified example
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(location2[1] - location1[1]);
    const dLon = toRadians(location2[0] - location1[0]);
    const lat1 = toRadians(location1[1]);
    const lat2 = toRadians(location2[1]);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return distance;
  }
  
  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  module.exports = { generateRandomLocation, calculateDistance };