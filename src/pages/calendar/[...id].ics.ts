import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { calendarFile } from '../../lib/calendar';

export async function getStaticPaths() {
  const notices = await getCollection('notices');
  return notices.filter(notice => notice.data.event).map(notice => ({ params: { id:notice.id }, props: { notice } }));
}
export const GET: APIRoute = ({ props }) => {
  const notice = props.notice as CollectionEntry<'notices'>;
  return new Response(calendarFile(notice.id, notice.data.title, notice.data.event!), {
    headers: { 'Content-Type':'text/calendar; charset=utf-8' },
  });
};
