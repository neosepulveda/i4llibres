import { getCollection, type CollectionEntry } from 'astro:content';
import type { Language } from './i18n';
export async function localizedNotices(language: Language) {
  const originals = await getCollection('notices');
  const translations = language === 'ca' ? [] : await getCollection('translations');
  return originals.map(notice => {
    const content = translations.find(entry => entry.id === `${language}/${notice.id}`);
    if (language !== 'ca' && !content) throw new Error(`Missing ${language} translation for ${notice.id}`);
    if (content && (!!notice.data.event !== !!content.data.event || notice.data.images.length !== (content.data.images?.length || 0))) throw new Error(`Incomplete translation: ${content.id}`);
    const translated: CollectionEntry<'notices'> = content ? {
      ...notice, data:{...notice.data, title:content.data.title, description:content.data.description, note:content.data.note,
        event:notice.data.event && {...notice.data.event,...content.data.event},
        images:notice.data.images.map((image,index)=>({...image,...content.data.images![index]})),
      },
    } : notice;
    return {notice:translated,content:content || notice};
  }).sort((a,b)=>a.notice.data.order-b.notice.data.order || (a.notice.data.date || '9999').localeCompare(b.notice.data.date || '9999') || a.notice.id.localeCompare(b.notice.id));
}
