const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const source = ts.transpileModule(fs.readFileSync(require.resolve('../app/benchmark/[id]/page.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const record={id:231,device_type:'CPU',device_name:'Test CPU',algorithm:'RandomX',coin_name:'XMR',created_at:null,avg_hashrate:5000,max_hashrate:5100,avg_power:100,avg_temp:null,duration_seconds:60};

async function render(responses) {
  const selections=[];
  const query={select(fields){selections.push(fields);return this;},eq(){return this;},returns(){return this;},abortSignal(){return this;},async maybeSingle(){return responses.shift();}};
  const exports={};
  vm.runInNewContext(source,{exports,process:{env:{BENCHMARK_METADATA_ENABLED:'true'}},AbortSignal,Intl,require(name){
    if(name==='react/jsx-runtime') return require(name);
    if(name==='next/link')return {default:({children,...props})=>React.createElement('a',props,children)};
    if(name==='next/navigation')return {notFound(){throw Error('404');}};
    if(name==='lucide-react')return new Proxy({},{get:()=>()=>null});
    if(name==='@/components/Header'||name==='@/components/Footer')return {default:()=>null};
    if(name==='@/lib/utils')return {formatHashrate:value=>`${value} H/s`};
    if(name==='@/lib/supabaseClient')return {supabase:{from:()=>query}};
    throw Error(`Unexpected module ${name}`);
  }});
  return {html:renderToStaticMarkup(await exports.default({params:Promise.resolve({id:'231'})})),selections};
}
test('renders real system values and RAM in GiB',async()=>{
  const {html}=await render([{data:{...record,os_name:'linux',os_arch:'x86_64',client_version:'0.8.33',cpu_cores:16,ram_total_bytes:34359738368,xmrig_version:'6.25.0'},error:null}]);
  for(const value of ['Linux','x86_64','32 GiB','0.8.33','6.25.0','Logical CPU threads'])assert.ok(html.includes(value));
});
test('falls back to legacy projection only for missing metadata columns',async()=>{
  const {html,selections}=await render([{data:null,error:{code:'42703'}},{data:record,error:null}]);
  assert.equal(selections.length,2);
  assert.ok(selections[0].includes('os_name'));
  assert.ok(!selections[1].includes('os_name'));
  assert.ok(html.includes('Not reported'));
});
test('does not hide unrelated service errors',async()=>{
  await assert.rejects(render([{data:null,error:{code:'08006'}}]),/temporarily unavailable/);
});
