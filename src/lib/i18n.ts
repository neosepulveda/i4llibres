export type Language = 'ca' | 'es' | 'en';
export const languages = ['ca', 'es', 'en'] as const;
export function languagePath(base: string, language: Language) {
  return `${base.replace(/\/$/, '')}/${language === 'ca' ? '' : language + '/'}`;
}
const ca = {
  pageTitle:'Els Llibres · El tauler d’I4B', description:'El tauler de les famílies d’I4B, la classe dels Llibres. Avisos de la classe i de l’Escola La Mar Bella.',
  backToTop:'Torna a dalt', skip:'Ves als avisos', course:'Curs 2026–27', dark:'Activa el mode fosc', light:'Activa el mode clar',
  footer:'Un petit tauler per estar al dia.', credits:'Preparat amb cura per les delegades d’I4B.',
  heading:'El tauler d’I4B', intro:'Avisos de la classe i de l’escola.',
  useful:'Enllaços útils', schoolCalendar:'Calendari escolar', notices:'Els avisos', filter:'Filtra els avisos', all:'Tots els avisos', singular:'avís', plural:'avisos',
  empty:'Encara no hi ha cap avís', emptyBody:'Quan hi hagi novetats de la classe o de l’escola, les trobaràs aquí.', noCategory:'No hi ha avisos d’aquesta categoria', reset:'Mostra tots els avisos',
  more:'Més informació', images:'Horaris per consultar i descarregar', openImage:'Obre la imatge en una pestanya nova', download:'Descarrega',
  add:'Afegeix al calendari', addYours:'Afegeix-ho al teu calendari', others:'Apple Calendar, Outlook i altres', ics:'Descarrega el fitxer .ics', barcelona:'Hora de Barcelona', allDay:'Tot el dia', upcoming:'Properes dates',
  filterAll:'Tots', categories:{classe:'I4B',escola:'Escola',menjador:'Menjador',afa:'AFA'},
};
type Messages = typeof ca;
export const messages: Record<Language, Messages> = {
  ca,
  es:{pageTitle:'Els Llibres · El tablón de I4B',description:'El tablón de las familias de I4B, la clase de Els Llibres. Avisos de la clase y de la Escola La Mar Bella.',backToTop:'Volver arriba',skip:'Ir a los avisos',course:'Curso 2026–27',dark:'Activar el modo oscuro',light:'Activar el modo claro',footer:'Un pequeño tablón para estar al día.',credits:'Preparado con cariño por las delegadas de I4B.',heading:'El tablón de I4B',intro:'Avisos de la clase y del colegio.',useful:'Enlaces útiles',schoolCalendar:'Calendario escolar',notices:'Los avisos',filter:'Filtrar los avisos',all:'Todos los avisos',singular:'aviso',plural:'avisos',empty:'Todavía no hay avisos',emptyBody:'Cuando haya novedades de la clase o del colegio, las encontrarás aquí.',noCategory:'No hay avisos de esta categoría',reset:'Mostrar todos los avisos',more:'Más información',images:'Horarios para consultar y descargar',openImage:'Abrir la imagen en una pestaña nueva',download:'Descargar',add:'Añadir al calendario',addYours:'Añádelo a tu calendario',others:'Apple Calendar, Outlook y otros',ics:'Descargar el archivo .ics',barcelona:'Hora de Barcelona',allDay:'Todo el día',upcoming:'Próximas fechas',filterAll:'Todos',categories:{classe:'I4B',escola:'Colegio',menjador:'Comedor',afa:'AFA'}},
  en:{pageTitle:'Els Llibres · I4B noticeboard',description:'The noticeboard for I4B families, the Els Llibres class. Class and school announcements from Escola La Mar Bella.',backToTop:'Back to top',skip:'Skip to notices',course:'School year 2026–27',dark:'Switch to dark mode',light:'Switch to light mode',footer:'A little noticeboard to keep you up to date.',credits:'Prepared with care by the I4B class representatives.',heading:'The I4B noticeboard',intro:'Class and school announcements.',useful:'Useful links',schoolCalendar:'School calendar',notices:'Notices',filter:'Filter notices',all:'All notices',singular:'notice',plural:'notices',empty:'No notices yet',emptyBody:'When there is news from the class or school, you’ll find it here.',noCategory:'No notices in this category',reset:'Show all notices',more:'More information',images:'Timetables to view and download',openImage:'Open image in a new tab',download:'Download',add:'Add to calendar',addYours:'Add to your calendar',others:'Apple Calendar, Outlook and others',ics:'Download the .ics file',barcelona:'Barcelona time',allDay:'All day',upcoming:'Upcoming dates',filterAll:'All',categories:{classe:'I4B',escola:'School',menjador:'Meals',afa:'AFA'}},
};
