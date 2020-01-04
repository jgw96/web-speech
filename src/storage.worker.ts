import { get } from 'idb-keyval';

export const searchTracks = async (searchQuery: string, sessions: any[]) => {
  if (searchQuery.length > 0) {
    const lowerCasedSearch = searchQuery.toLowerCase();

    const foundSession = sessions.find((element) => {
      console.log(element);
      return element.name.toLowerCase().includes(lowerCasedSearch);
    });

    console.log(foundSession);

    return [foundSession];
  }
  else {
    const saved: Array<any> = await get('savedSessions');

    if (saved) {
      console.log(saved);
      return saved;
    }
  }
}