// Stable IDs for the opening playtest. Existing campaign and checkpoint IDs are preserved.
export const riverStart = 500;
const [village, bank, ridge, intake, works, arena, crossing] = Array.from({length: 7}, (_, i) => riverStart + i);
const lit = 'river-guide-lamp';
const drained = 'river-sluice-aligned';
const wheel = 'river-sluice-wheel';
const passage = (id, label, at, to, entry, requires = [], hint = '') =>
  ({id, label, at, to, entry, requires, hint});

export const riverChapter = {
  rooms: [
    {
      id: village, name: 'Alderwick', kind: 'overworld', land: 'alderwick', map: {x:0,y:1},
      checkpoint: true, checkpointAt: [5.5,6.5], exits: {east:bank},
      tiles: [
        '################',
        '#...###...######',
        '#...###...######',
        '#...........####',
        '#...............',
        '#...............',
        '#.........##....',
        '##........##...#',
        '####..........##',
        '################',
      ],
      characters: [{id:'river-mira', name:'Mira', at:[9.5,4.5], text:'The river has swallowed the east road. Follow the bank to the old waterworks. Light the guide lamp to unfold its entry bridge.'}],
    },
    {
      id: bank, name: 'Willowbank', kind: 'overworld', land: 'alderwick', map: {x:1,y:1},
      exits: {west:village,east:crossing,north:ridge},
      tiles: [
        '#######...######',
        '###.........####',
        '##...##.......##',
        '#.........~~~~##',
        '.........DDDDDDD',
        '.........DDDDDDD',
        '#..........~~~##',
        '#.........######',
        '###.......DD.###',
        '################',
      ],
      puzzles: [{id:lit, source:[7.5,6.5], seconds:.7, controls:[], text:'The guide lamp catches. Its light unfolds the footbridge to the waterworks.'}],
      gates: [
        ...[4.5,5.5].flatMap(y=>Array.from({length:7},(_, i)=>({at:[9.5+i,y],requires:[wheel]}))),
        ...[10.5,11.5].map(x=>({at:[x,8.5],requires:[lit]})),
      ],
      links: [passage('river-intake-stairs','Waterworks',[12.5,8.5],intake,[2.5,5.5],[lit],'Raise the lantern beside the amber guide lamp on the bank.')],
      characters: [{id:'river-flood-sign',name:'Flood marker',at:[8.5,3.5],text:'The east road is under water. The waterworks wheel controls the floodgate.'}],
    },
    {
      id: ridge, name: 'Heron Ridge', kind: 'overworld', land: 'alderwick', map: {x:1,y:0},
      exits: {south:bank},
      tiles: [
        '################',
        '####.......#####',
        '###.......DD.###',
        '##...........###',
        '###.....##....##',
        '#####.....##..##',
        '####.........###',
        '###.........####',
        '#####.....######',
        '#######...######',
      ],
      rewards: [{id:'river-ridge-cache',at:[11.5,2.5],tonics:1,text:'A trail keeper left a sunleaf tonic beside the heron stones.'}],
    },
    {
      id: intake, name: 'Waterworks · Intake', kind: 'dungeon', land:'alderwick', dungeon:1,
      checkpoint:true, checkpointAt:[5.5,7.5],
      tiles:[
        '################',
        '#..............#',
        '#..~~~.......#.#',
        '#..~~~...##....#',
        '#........##....#',
        '#..............#',
        '#......~~~.....#',
        '#......~~~.....#',
        '#..............#',
        '################',
      ],
      links:[
        passage('river-intake-return','Willowbank',[2.5,5.5],bank,[12.5,8.5]),
        passage('river-intake-works','Sluice chamber',[13.5,5.5],works,[2.5,5.5]),
      ],
      encounters:[{kind:'fen-moth',x:10.5,y:3.5,hp:2}],
    },
    {
      id: works, name: 'Waterworks · Sluice chamber', kind:'dungeon', land:'alderwick', dungeon:1,
      tiles:[
        '################',
        '#..............#',
        '#....~~~~~~....#',
        '#..............#',
        '#..###...###...#',
        '#..............#',
        '#..###...###...#',
        '#..............#',
        '#..............#',
        '################',
      ],
      links:[
        passage('river-works-return','Intake',[1.5,5.5],intake,[12.5,5.5]),
        passage('river-works-arena','Wheelhouse',[14.5,5.5],arena,[2.5,5.5],[drained],'Set both sluice controls to 1, then raise the lantern at the receiver.'),
      ],
      puzzles:[{id:drained,source:[8.5,5.5],seconds:1,controls:[
        {at:[5.5,3.5],states:2,target:1},{at:[10.5,7.5],states:2,target:1},
      ],hint:'Turn both sluice controls to 1, then hold the raised lantern at the receiver.',text:'The two channels align. The wheelhouse door opens.'}],
    },
    {
      id:arena, name:'Waterworks · Wheelhouse', kind:'dungeon', land:'alderwick', dungeon:1,
      tiles:[
        '################',
        '#..............#',
        '#.##.......##..#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#.##.......##..#',
        '#..............#',
        '################',
      ],
      links:[
        passage('river-arena-return','Sluice chamber',[1.5,5.5],works,[13.5,5.5]),
        passage('river-service-lift','Service lift',[13.5,2.5],bank,[7.5,6.5],[wheel],'The wheel key operates the lift.'),
      ],
      encounters:[{kind:'volley',name:'Silt Warden',x:10.5,y:5.5,boss:true,hp:4,tell:1.5,strike:.6,recover:2}],
      rewards:[{id:'river-warden-cleared',at:[12.5,6.5],requires:[drained],clear:true,equipment:wheel,text:'You take the sluice wheel. The east crossing drains. Use the service lift to return to the bank.'}],
    },
    {
      id:crossing,name:'East Crossing',kind:'overworld',land:'alderwick',map:{x:2,y:1},
      checkpoint:true,checkpointAt:[9.5,5.5],exits:{west:bank},
      tiles:[
        '################',
        '#####.......####',
        '###...........##',
        '#.~...........##',
        '...............#',
        '...............#',
        '#.~~~..........#',
        '#..~~.........##',
        '####..........##',
        '################',
      ],
      characters:[{id:'river-east-view',name:'Trail marker',at:[13.5,4.5],text:'The east road is open. Beyond these hills lies the next chapter. Save at the waystone before leaving.'}],
    },
  ],
};

export function riverObjective(state) {
  if(state.room===crossing) return 'East road restored. Save at the waystone to finish the chapter.';
  if(state.equipment.includes(wheel)) return 'Return to Willowbank and follow the opened road east.';
  if(state.room===arena) return 'Raise the lantern, dodge the sparks, then strike while the Warden recovers.';
  if(state.room===works) return 'Align both sluice controls and light the receiver.';
  if(state.room===intake) return 'Find the sluice chamber. The intake waystone heals and saves.';
  if(state.events.includes(lit)) return 'Follow the bank south to the marked waterworks entrance.';
  return 'Follow the river east from Alderwick. Raise the lantern at the guide lamp.';
}
