export const imageAlts = {
  '/assets/images/living-room.webp': 'Вітальня з панорамними вікнами та видом на місто',
  '/assets/images/panoramic-interior.webp': 'Кухня-їдальня з панорамними вікнами',
  '/assets/images/residence.webp': 'Житловий комплекс із внутрішнім двором',
  '/assets/images/villa.webp': 'Двоповерховий будинок із ландшафтним подвір’ям',
  '/assets/images/bedroom.webp': 'Спальня з панорамними вікнами'
};

export const propertyTypes = {
  apartment: 'Квартира',
  house: 'Будинок'
};

export let dataLoadError = null;

export const properties = await fetch(new URL('../data/properties.json', import.meta.url))
  .then(response => {
    if (!response.ok) throw new Error(`Не вдалося завантажити дані: ${response.status}`);
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new TypeError('Очікувався масив об’єктів');
    return data;
  })
  .catch(error => {
    dataLoadError = error;
    return [];
  });

export const formatUsd = value => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value).replace('USD', '$');
export const formatUah = value => `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value)} грн`;
