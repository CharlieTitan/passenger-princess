import "./globals.css";
import "./us.css";
export const metadata={
  title:"US",
  description:"Charlie & Tayla",
  applicationName:"US",
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,title:"US",statusBarStyle:"default"},
  icons:{icon:"/icon.svg"}
};
export const viewport={themeColor:"#f6efec",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function Layout({children}){return <html lang="en"><body>{children}</body></html>}
