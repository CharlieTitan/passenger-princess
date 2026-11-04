import {kv} from "@vercel/kv";
import {sanitizeSurprise,validSessionUser} from "../../../lib/usServer.mjs";

export const dynamic="force-dynamic";
const privateHeaders={"cache-control":"private, no-store, max-age=0","vary":"Cookie"};
const parse=x=>!x?null:(typeof x==="string"?JSON.parse(x):x);
// Escape every line separator as well as RFC 5545 punctuation to prevent field injection.
function esc(value=""){return String(value).replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");}
function stamp(date){return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");}
function failure(message,status){return new Response(message,{status,headers:privateHeaders});}
export async function GET(req){
  const sid=req.cookies.get("us_session")?.value;
  const session=sid?parse(await kv.get("us:session:"+sid)):null;
  const user=validSessionUser(session);
  if(!user)return failure("Unauthorized",401);
  const users=parse(await kv.get("us:auth:users"))||{};
  if(users[user]?.sessionsRevokedAt&&(!Number.isFinite(session.createdAt)||session.createdAt<=users[user].sessionsRevokedAt))return failure("Unauthorized",401);
  const id=new URL(req.url).searchParams.get("id");
  if(!id)return failure("Not found",404);
  const stored=parse(await kv.hget("us:items",id));
  if(!stored)return failure("Not found",404);
  const item=sanitizeSurprise(stored,session.user);
  if(stored.isSurprise&&(stored.surprise?.creator||stored.addedBy)!==session.user&&!item.surprise?.isRevealed)return failure("Surprise locked",403);
  const date=item.planDate||item.surprise?.date;
  const time=item.planTime||item.surprise?.time||"19:00";
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||"")||!/^\d{2}:\d{2}$/.test(time))return failure("Plan date unavailable",400);
  const start=new Date(date+"T"+time+":00+04:00");
  if(Number.isNaN(start.getTime()))return failure("Plan date unavailable",400);
  const end=new Date(start.getTime()+2*60*60*1000);
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//US//Shared Plans//EN","BEGIN:VEVENT","UID:"+esc(item.id)+"@us","DTSTAMP:"+stamp(new Date()),"DTSTART:"+stamp(start),"DTEND:"+stamp(end),"SUMMARY:"+esc(item.title),"LOCATION:"+esc(item.location||item.surprise?.location||""),"DESCRIPTION:"+esc(item.planNotes||item.surprise?.note||""),"END:VEVENT","END:VCALENDAR"].join("\r\n");
  return new Response(ics,{headers:{...privateHeaders,"content-type":"text/calendar; charset=utf-8","content-disposition":'attachment; filename="us-plan.ics"'}});
}
