export type Language = 'ca' | 'es' | 'en';
export const languages = ['ca', 'es', 'en'] as const;
export function languagePath(base: string, language: Language) {
  return `${base.replace(/\/$/, '')}/${language === 'ca' ? '' : language + '/'}`;
}
const ca = {
  pageTitle:'Els Llibres · El tauler d’I4B', description:'El tauler de les famílies d’I4B, la classe dels Llibres. Avisos de la classe i de l’Escola La Mar Bella.',
  skip:'Ves als avisos', dark:'Activa el mode fosc', light:'Activa el mode clar',
  footer:'Un petit tauler per estar al dia.', credits:'Preparat amb cura per les delegades d’I4B.', theEnd:'Fi',
  heading:'El tauler d’I4B', school:'I4B, Escola La Mar Bella', courseCover:'I4B, curs 2026–27', bookplate:'Aquest llibre és de les famílies d’I4B.', openBook:'Obre el llibre',
  schoolCalendar:'Calendari escolar 2026–27', newTab:'S’obre en una pestanya nova',
  menus:'Menús {month}', menusPocket:'Menús del menjador', menusHint:'Toca un menú per veure’l sencer.', takeMenusOut:'Treu els menús', putMenusBack:'Torna’ls a la butxaca', adaptedMenus:'Al·lèrgies i dietes',
  menuKinds:{basal:'Menú basal',fitxa:'Fitxa del mes',sopars:'Proposta de sopars',receptes:'Receptes dels sopars'}, lunchtimeInfo:'Espai migdia: contacte i preus',
  noDates:'Ara mateix no hi ha cap data a la vista.', noDatesBody:'Quan n’hi hagi, les trobareu aquí.',
  moreDate:'Mostra {n} data més', moreDates:'Mostra {n} dates més', fewerDates:'Mostra’n menys',
  notices:'Els avisos', filter:'Filtra els avisos', showAll:'Mostra’ls tots', filtersShortcut:'Filtres', singular:'avís', plural:'avisos',
  countSuffix:{classe:'d’I4B',escola:'de l’escola',menjador:'del menjador',afa:'de l’AFA'},
  empty:'Encara no hi ha cap avís', emptyBody:'Quan hi hagi novetats de la classe o de l’escola, les trobaràs aquí.', noCategory:'No hi ha avisos d’aquesta categoria', reset:'Mostra tots els avisos',
  more:'Més informació', images:'Imatges per consultar i descarregar', openImage:'Obre la imatge en una pestanya nova', tapImage:'Toca la imatge per veure-la sencera.', download:'Descarrega',
  add:'Afegeix al calendari', others:'Apple Calendar, Outlook i altres', ics:'Descarrega el fitxer .ics', barcelona:'hora de Barcelona', allDay:'Tot el dia', upcoming:'Properes dates',
  filterAll:'Tots', categories:{classe:'I4B',escola:'Escola',menjador:'Menjador',afa:'AFA'},
};
type Messages = typeof ca;
export const messages: Record<Language, Messages> = {
  ca,
  es:{
    pageTitle:'Els Llibres · El tablón de I4B', description:'El tablón de las familias de I4B, la clase de Els Llibres. Avisos de la clase y de la Escola La Mar Bella.',
    skip:'Ir a los avisos', dark:'Activar el modo oscuro', light:'Activar el modo claro',
    footer:'Un pequeño tablón para estar al día.', credits:'Preparado con cariño por las delegadas de I4B.', theEnd:'Fin',
    heading:'El tablón de I4B', school:'I4B, Escola La Mar Bella', courseCover:'I4B, curso 2026–27', bookplate:'Este libro es de las familias de I4B.', openBook:'Abrir el libro',
    schoolCalendar:'Calendario escolar 2026–27', newTab:'Se abre en una pestaña nueva',
    menus:'Menús {month}', menusPocket:'Menús del comedor', menusHint:'Toca un menú para verlo entero. Los menús están en catalán.', takeMenusOut:'Saca los menús', putMenusBack:'Guárdalos en el bolsillo', adaptedMenus:'Alergias y dietas',
    menuKinds:{basal:'Menú basal',fitxa:'Ficha del mes',sopars:'Propuesta de cenas',receptes:'Recetas de las cenas'}, lunchtimeInfo:'Mediodía: contacto y precios',
    noDates:'Ahora mismo no hay ninguna fecha a la vista.', noDatesBody:'Cuando las haya, las encontraréis aquí.',
    moreDate:'Mostrar {n} fecha más', moreDates:'Mostrar {n} fechas más', fewerDates:'Mostrar menos',
    notices:'Los avisos', filter:'Filtrar los avisos', showAll:'Mostrarlos todos', filtersShortcut:'Filtros', singular:'aviso', plural:'avisos',
    countSuffix:{classe:'de I4B',escola:'del colegio',menjador:'del comedor',afa:'de la AFA'},
    empty:'Todavía no hay avisos', emptyBody:'Cuando haya novedades de la clase o del colegio, las encontrarás aquí.', noCategory:'No hay avisos de esta categoría', reset:'Mostrar todos los avisos',
    more:'Más información', images:'Imágenes para consultar y descargar', openImage:'Abrir la imagen en una pestaña nueva', tapImage:'Toca la imagen para verla entera.', download:'Descargar',
    add:'Añadir al calendario', others:'Apple Calendar, Outlook y otros', ics:'Descargar el archivo .ics', barcelona:'hora de Barcelona', allDay:'Todo el día', upcoming:'Próximas fechas',
    filterAll:'Todos', categories:{classe:'I4B',escola:'Colegio',menjador:'Comedor',afa:'AFA'},
  },
  en:{
    pageTitle:'Els Llibres · I4B noticeboard', description:'The noticeboard for I4B families, the Els Llibres class. Class and school announcements from Escola La Mar Bella.',
    skip:'Skip to notices', dark:'Switch to dark mode', light:'Switch to light mode',
    footer:'A little noticeboard to keep you up to date.', credits:'Prepared with care by the I4B class representatives.', theEnd:'The End',
    heading:'The I4B noticeboard', school:'I4B, Escola La Mar Bella', courseCover:'I4B, school year 2026–27', bookplate:'This book belongs to the I4B families.', openBook:'Open the book',
    schoolCalendar:'School calendar 2026–27', newTab:'Opens in a new tab',
    menus:'{month} menus', menusPocket:'Lunch menus', menusHint:'Tap a menu to see it in full. The menus are in Catalan.', takeMenusOut:'Take the menus out', putMenusBack:'Put them back', adaptedMenus:'Allergies and diets',
    menuKinds:{basal:'Main menu',fitxa:'This month’s tips',sopars:'Dinner ideas',receptes:'Dinner recipes'}, lunchtimeInfo:'Lunchtime: contacts and prices',
    noDates:'There are no dates coming up right now.', noDatesBody:'When there are, you’ll find them here.',
    moreDate:'Show {n} more date', moreDates:'Show {n} more dates', fewerDates:'Show fewer',
    notices:'Notices', filter:'Filter notices', showAll:'Show all', filtersShortcut:'Filters', singular:'notice', plural:'notices',
    countSuffix:{classe:'from I4B',escola:'from the school',menjador:'about school meals',afa:'from the AFA'},
    empty:'No notices yet', emptyBody:'When there is news from the class or school, you’ll find it here.', noCategory:'No notices in this category', reset:'Show all notices',
    more:'More information', images:'Pictures to view and download', openImage:'Open image in a new tab', tapImage:'Tap the image to see it in full.', download:'Download',
    add:'Add to calendar', others:'Apple Calendar, Outlook and others', ics:'Download the .ics file', barcelona:'Barcelona time', allDay:'All day', upcoming:'Upcoming dates',
    filterAll:'All', categories:{classe:'I4B',escola:'School',menjador:'Meals',afa:'AFA'},
  },
};
