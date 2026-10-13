const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const security = require('../lib/benchmarkSecurity');
const wallet = '2C3LWVjZNyMp4dSsrkYPWB7HLhXbgm7CQFoA24nFTaCA';
const metadata = {os_name:'linux',os_arch:'x86_64',client_version:'0.8.33',cpu_cores:16,ram_total_bytes:34359738368,xmrig_version:'6.25.0'};
const source = ts.transpileModule(fs.readFileSync(require.resolve('../pages/api/benchmarks.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;

for (const enabled of [false,true]) test(`API persists metadata only when flag is ${enabled}`, async () => {
  let inserted;
  const query = {
    select(){return this;}, eq(){return this;}, gte(){return this;},
    async limit(){return {data:[],error:null};},
    insert(rows){inserted=rows[0];return this;},
    async single(){return {data:{id:42,created_at:'2026-09-12'},error:null};},
  };
  const exports = {};
  vm.runInNewContext(source, {exports,require(name){
    if(name==='@supabase/supabase-js') return {createClient:()=>({from:()=>query})};
    return {...security,verifyBenchmarkToken:()=>({walletAddress:wallet})};
  },process:{env:{BENCHMARK_METADATA_ENABLED:String(enabled)}},console,Date});
  const response = {statusCode:0,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;},setHeader(){}};
  await exports.default({method:'POST',headers:{authorization:'test'},body:{...metadata,avg_hashrate:5000,max_hashrate:5100,duration_seconds:60,device_type:'CPU',device_name:'Test CPU',algorithm:'RandomX',coin_name:'XMR',solana_wallet_address:wallet,device_uid:'test-device'}},response);
  assert.equal(response.statusCode,201);
  for(const [field,value] of Object.entries(metadata)) assert.equal(inserted[field],enabled?value:undefined);
  assert.deepEqual(Object.keys(response.body.benchmark).sort(),['created_at','id']);
});
