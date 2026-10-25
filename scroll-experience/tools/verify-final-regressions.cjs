/* Preserve historical output. Only redirect existing suites' output paths;
   execute their assertions unchanged, with their original __dirname. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../verification/final-polish-20261025/regression');
fs.mkdirSync(path.join(root,'finish'),{recursive:true});
for(const name of ['verify-static.cjs','verify-emergence.cjs','verify-finish.cjs','verify-revisions.cjs']){
 const file=path.join(__dirname,name);
 const source=fs.readFileSync(file,'utf8')
  .replace("'verification/static-report.json'","'verification/final-polish-20261025/regression/static-report.json'")
  .replace("'verification/emergence-report.json'","'verification/final-polish-20261025/regression/emergence-report.json'")
  .replace("path.join(app,'verification/finish-20261022')",JSON.stringify(path.join(root,'finish')))
  .replace("path.resolve(__dirname, '../verification')",JSON.stringify(root));
 const launch=`const Module=require('node:module');const m=new Module(${JSON.stringify(file)},module);m.filename=${JSON.stringify(file)};m.paths=module.paths;m._compile(${JSON.stringify(source)},m.filename);`;
 const result=spawnSync(process.execPath,['-e',launch],{encoding:'utf8',windowsHide:true});
 fs.writeFileSync(path.join(root,name+'.log'),result.stdout+result.stderr);
 console.log(name+': '+result.status);
 if(result.status!==0){console.error(result.stdout,result.stderr);process.exitCode=1;}
}
