const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=path.resolve(__dirname,'..'),repo=path.dirname(app),errors=[];
const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&e.name!=='verification'?walk(path.join(folder,e.name)):e.isFile()?[path.join(folder,e.name)]:[]);
const files=walk(app),js=files.filter(f=>f.endsWith('.js'));
for(const file of js){new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});}
const html=fs.readFileSync(path.join(app,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const value=match[1];if(/^(data:|https?:)/.test(value))continue;if(!fs.existsSync(path.resolve(app,value)))errors.push('Missing HTML asset '+value);}
for(const file of js)for(const match of fs.readFileSync(file,'utf8').matchAll(/['"](\.\.\/[^'"\n]+\.html)['"]/g))if(!fs.existsSync(path.resolve(app,match[1])))errors.push('Missing scene source '+match[1]);
const textFiles=files.filter(f=>/\.(js|cjs|css|html|md|py)$/.test(f));
for(const file of textFiles)if(fs.readFileSync(file).includes(Buffer.from('\r\n')))errors.push('CRLF: '+path.relative(app,file));
const context=vm.createContext({});context.window=context;
vm.runInContext(fs.readFileSync(path.join(app,'js/core.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(app,'js/patterns.js'),'utf8'),context);
const model=context.WTE.patterns;
let area=0;
for(const cell of model.cells){
 let twiceArea=0;
 for(let i=0;i<cell.polygon.length;i++){
  const a=cell.polygon[i],b=cell.polygon[(i+1)%cell.polygon.length];twiceArea+=a.x*b.y-b.x*a.y;
  const own=(a.x-cell.site.x)**2+(a.y-cell.site.y)**2;
  for(const site of model.sites)assert(own<=(a.x-site.x)**2+(a.y-site.y)**2+1e-7,'Voronoi nearest-site invariant');
 }
 area+=Math.abs(twiceArea)/2;
}
assert(Math.abs(area-4)<1e-7,'Voronoi polygons cover the 2x2 domain exactly');
const data=JSON.parse(fs.readFileSync(path.join(app,'js/patterns.js'),'utf8').match(/const reactionData = (\[.*\]);/)[1]);
assert.equal(data.length,96);assert.equal(model.reactionSteps.length,data.length);
assert(model.reactionSteps.every((n,i)=>Number.isInteger(n)&&(i===0||n>model.reactionSteps[i-1])));
const coverage=data.map(s=>{const bytes=Buffer.from(s,'base64');assert.equal(bytes.length,1152);return [...bytes].reduce((sum,n)=>sum+n.toString(2).replaceAll('0','').length,0);});
assert(coverage.every(n=>n>0&&n<9216),'Gray–Scott snapshots contain both phases');
const report={javascriptFiles:js.length,textFiles:textFiles.length,allNewTextLF:true,voronoiCells:model.cells.length,voronoiArea:area,reactionFrames:data.length,reactionActivePixels:coverage,errors};
fs.writeFileSync(path.join(app,'verification/static-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
