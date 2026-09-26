import type { APIRoute } from 'astro';
import { localizedNotices } from '../../../lib/localized-notices';
import { calendarFile } from '../../../lib/calendar';
export async function getStaticPaths() {
  const paths = await Promise.all((['es','en'] as const).map(async language => {
    const entries = await localizedNotices(language);
    return entries.filter(({notice})=>notice.data.event).map(({notice})=>({params:{lang:language,id:notice.id},props:{notice}}));
  }));
  return paths.flat();
}
export const GET: APIRoute = ({props}) => new Response(calendarFile(props.notice.id,props.notice.data.title,props.notice.data.event),{headers:{'Content-Type':'text/calendar; charset=utf-8'}});
