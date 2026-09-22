import assert from 'node:assert/strict';
import test from 'node:test';
import { storyTimeline, quadTransform } from '../src/components/camera/scroll-story.ts';

test('the story progresses through the requested physical stages and clamps its input',()=>{
 assert.equal(storyTimeline(-1).travel,0);
 assert.equal(storyTimeline(.2).travel,1);
 assert.equal(storyTimeline(.5).enter,1);
 assert.equal(storyTimeline(.5).servicesActive,true);
 assert.equal(storyTimeline(.8).exit,1);
 assert.equal(storyTimeline(.82).explode,1);
 assert.equal(storyTimeline(2).explode,1);
 assert.equal(storyTimeline(2).footer,1);
});
test('every animation channel is continuous and stays between zero and one',()=>{
 let previous=storyTimeline(0);
 for(let i=1;i<=10000;i++){
  const next=storyTimeline(i/10000);
  for(const key of ['travel','approach','enter','browse','exit','explode','footer']){
   assert(next[key]>=0&&next[key]<=1,key);
   assert(Math.abs(next[key]-previous[key])<.01,key);
  }
  previous=next;
 }
});
test('the projected HTML corners exactly match the physical screen quad',()=>{
 for(const points of [[[10,20],[910,20],[910,620],[10,620]],[[120,80],[740,130],[820,610],[80,720]]]){
  const m=quadTransform(points,1440,900);
  const source=[[0,0],[1440,0],[1440,900],[0,900]];
  source.forEach(([x,y],i)=>{
   const w=m[3]*x+m[7]*y+m[15];
   assert(Math.abs((m[0]*x+m[4]*y+m[12])/w-points[i][0])<1e-7);
   assert(Math.abs((m[1]*x+m[5]*y+m[13])/w-points[i][1])<1e-7);
  });
 }
});
