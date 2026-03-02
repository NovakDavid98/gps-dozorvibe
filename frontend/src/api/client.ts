export const apiClient = {
  async getVehicles(groupCode: string = 'SAGU') {
    const res = await fetch(`http://localhost:3001/api/fleet/vehicles/group/${groupCode}`);
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },
  
  async getTrips(code: string, from: string, to: string) {
    const res = await fetch(`http://localhost:3001/api/fleet/vehicle/${code}/trips?from=${from}&to=${to}`);
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
  },

  async getHistory(codes: string, from: string, to: string) {
    const res = await fetch(`http://localhost:3001/api/fleet/vehicles/history/${codes}?from=${from}&to=${to}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async getBranches(groupCode: string = 'SAGU') {
    const res = await fetch(`http://localhost:3001/api/fleet/groups/${groupCode}/branches`);
    if (!res.ok) throw new Error('Failed to fetch branches');
    return res.json();
  },

  async getGeocode(lat: number, lon: number) {
    const res = await fetch(`http://localhost:3001/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Failed to fetch geocode');
    return res.json();
  },

  async getWeather(lat: number, lon: number, startDate: string, endDate: string) {
    const res = await fetch(`http://localhost:3001/api/weather/history?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch weather');
    return res.json();
  }
};