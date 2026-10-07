import { kv } from "@vercel/kv";
const NS="us:";
const parse=(x)=>!x?null:(typeof x==="string"?JSON.parse(x):x);
async function sessionUser(req){
  const sid=req.cookies.get("us_session")?.value;
  if(!sid)return null;
  const s=parse(await kv.get(NS+"session:"+sid));
  if(!s||s.expiresAt<Date.now())return null;
  return s.user;
}
function esc(v=""){return String(v).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;")}
function stamp(date,time){
  const d=(date||"").replaceAll("-","");
  const t=(time||"19:00").replace(":","")+"00";
  return d+"T"+t;
}
export async function GET(req){
  const user=await sessionUser(req);
  if(!user)return new Response("Unauthorized",{status:401});
  const id=new URL(req.url).searchParams.get("id");
  const item=parse(await kv.hget(NS+"items",id));
  if(!item||!item.planDate)return new Response("Not found",{status:404});
  const start=stamp(item.planDate,item.planTime);
  const startDate=new Date(item.planDate+"T"+(item.planTime||"19:00"));
  startDate.setHours(startDate.getHours()+2);
  const pad=(n)=>String(n).padStart(2,"0");
  const end=startDate.getFullYear()+pad(startDate.getMonth()+1)+pad(startDate.getDate())+"T"+pad(startDate.getHours())+pad(startDate.getMinutes())+"00";
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//US//Shared Plans//EN","BEGIN:VEVENT","UID:"+esc(item.id)+"@us","DTSTART:"+start,"DTEND:"+end,"SUMMARY:"+esc(item.title),"LOCATION:"+esc(item.location||""),"DESCRIPTION:"+esc(item.planNotes||""),"END:VEVENT","END:VCALENDAR"].join("\r\n");
  return new Response(ics,{headers:{"content-type":"text/calendar; charset=utf-8","content-disposition":'attachment; filename="us-plan.ics"'}});
}
