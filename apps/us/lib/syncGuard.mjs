export function createSyncGuard() {
  let epoch=0, active=0, sequence=0;
  return {
    beginMutation(){ epoch++; active++; let ended=false; return ()=>{if(!ended){active--;epoch++;ended=true;}}; },
    beginRead(){return {epoch,sequence:++sequence};},
    accepts(ticket){return active===0&&ticket.epoch===epoch&&ticket.sequence===sequence;},
    busy(){return active>0;},
    reset(){epoch++;sequence++;}
  };
}
