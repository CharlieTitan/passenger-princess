import "./globals.css";
import "./us.css";
import PwaRegistration from "./components/PwaRegistration";
export const metadata={
  title:"US",description:"Charlie & Tayla",applicationName:"US",
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,title:"US",statusBarStyle:"default"},
  icons:{icon:[{url:"/icon.svg",type:"image/svg+xml"},{url:"/icon-192.png",type:"image/png",sizes:"192x192"}],apple:[{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]}
};
export const viewport={themeColor:"#f6efec",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function Layout({children}){return <html lang="en"><body>{children}<PwaRegistration/></body></html>}
