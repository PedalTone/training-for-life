import {gpsPace,gpsUsesPace,type GpsWorkout} from './gps-math';
import {gpsSegments,splitTime} from './gps-laps';

export function GpsSplitsTable({workout,unit='mi'}:{workout:GpsWorkout;unit?:'mi'|'km'}) {
 const rows=gpsSegments(workout);
 if(!rows.length)return workout.lapMode?<p className="gps-splits-note">No repeat splits were saved for this recording. Only its overall totals are available.</p>:null;
 const usesPace=gpsUsesPace(workout.activity);
 return <section className="gps-splits-results" aria-label="Repeats and recovery">
  <h4>Repeats &amp; recovery</h4>
  <table>
   <caption>Every repeat and the recovery between repeats</caption>
   <thead><tr><th scope="col">Segment</th><th scope="col">Time</th><th scope="col" aria-label="Distance in meters">Dist.<small>meters</small></th><th scope="col">{usesPace?'Avg pace':'Avg speed'}<small>{usesPace?`min/${unit}`:unit==='mi'?'mph':'km/h'}</small></th></tr></thead>
   <tbody>{rows.map((row,index)=><tr key={index} className={row.kind==='recovery'?'gps-recovery-row':undefined}>
    <th scope="row">{row.kind==='repeat'?`Repeat ${row.number}`:'Recovery'}</th>
    <td>{splitTime(row.seconds)}</td><td>{row.meters===null?'—':Math.round(row.meters).toLocaleString('en-US')}</td>
    <td>{row.kind==='recovery'||!row.meters||!row.seconds?'—':usesPace?gpsPace(row.meters/row.seconds,unit):(row.meters/row.seconds*3600/(unit==='mi'?1609.344:1000)).toFixed(1)}</td>
   </tr>)}</tbody>
  </table>
  {rows.some(row=>row.kind==='recovery')&&<p className="gps-splits-note">Recovery is timed while paused; distance and pace are not tracked.{rows.some(row=>row.estimated)?' Older recovery times are estimated from saved split timestamps.':''}</p>}
 </section>;
}
