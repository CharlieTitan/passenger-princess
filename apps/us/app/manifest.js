export default function manifest(){
  return {
    name:"US",
    short_name:"US",
    description:"Charlie & Tayla",
    start_url:"/",
    scope:"/",
    display:"standalone",
    background_color:"#f6efec",
    theme_color:"#f6efec",
    icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]
  };
}
