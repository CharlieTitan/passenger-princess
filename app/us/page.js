import {redirect} from "next/navigation";
// One canonical shared app avoids divergent clients against the same private database.
export default function Us(){redirect("https://tay-princess.vercel.app/");}
