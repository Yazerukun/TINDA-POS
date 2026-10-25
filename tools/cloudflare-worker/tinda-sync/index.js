var Le=Object.defineProperty;var Ht=(e,t,r)=>t in e?Le(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var l=(e,t)=>Le(e,"name",{value:t,configurable:!0});var xe=(e,t,r)=>(Ht(e,typeof t!="symbol"?t+"":t,r),r);function p(e){return new Error(`[unenv] ${e} is not implemented yet!`)}l(p,"createNotImplementedError");function D(e){return Object.assign(l(()=>{throw p(e)},"fn"),{__unenv__:!0})}l(D,"notImplemented");function ve(e){return class{__unenv__=!0;constructor(){throw new Error(`[unenv] ${e} is not implemented yet!`)}}}l(ve,"notImplementedClass");var ie=globalThis.performance?.timeOrigin??Date.now(),ce=globalThis.performance?.now?globalThis.performance.now.bind(globalThis.performance):()=>Date.now()-ie,kt={name:"node",entryType:"node",startTime:0,duration:0,nodeStart:0,v8Start:0,bootstrapComplete:0,environment:0,loopStart:0,loopExit:0,idleTime:0,uvMetricsInfo:{loopCount:0,events:0,eventsWaiting:0},detail:void 0,toJSON(){return this}},L=class{__unenv__=!0;detail;entryType="event";name;startTime;constructor(t,r){this.name=t,this.startTime=r?.startTime||ce(),this.detail=r?.detail}get duration(){return ce()-this.startTime}toJSON(){return{name:this.name,entryType:this.entryType,startTime:this.startTime,duration:this.duration,detail:this.detail}}};l(L,"PerformanceEntry");var le=l(class extends L{entryType="mark";constructor(){super(...arguments)}get duration(){return 0}},"PerformanceMark"),U=class extends L{entryType="measure"};l(U,"PerformanceMeasure");var B=class extends L{entryType="resource";serverTiming=[];connectEnd=0;connectStart=0;decodedBodySize=0;domainLookupEnd=0;domainLookupStart=0;encodedBodySize=0;fetchStart=0;initiatorType="";name="";nextHopProtocol="";redirectEnd=0;redirectStart=0;requestStart=0;responseEnd=0;responseStart=0;secureConnectionStart=0;startTime=0;transferSize=0;workerStart=0;responseStatus=0};l(B,"PerformanceResourceTiming");var G=class{__unenv__=!0;getEntries(){return[]}getEntriesByName(t,r){return[]}getEntriesByType(t){return[]}};l(G,"PerformanceObserverEntryList");var W=class{__unenv__=!0;timeOrigin=ie;eventCounts=new Map;_entries=[];_resourceTimingBufferSize=0;navigation=void 0;timing=void 0;timerify(t,r){throw p("Performance.timerify")}get nodeTiming(){return kt}eventLoopUtilization(){return{}}markResourceTiming(){return new B("")}onresourcetimingbufferfull=null;now(){return this.timeOrigin===ie?ce():Date.now()-this.timeOrigin}clearMarks(t){this._entries=t?this._entries.filter(r=>r.name!==t):this._entries.filter(r=>r.entryType!=="mark")}clearMeasures(t){this._entries=t?this._entries.filter(r=>r.name!==t):this._entries.filter(r=>r.entryType!=="measure")}clearResourceTimings(){this._entries=this._entries.filter(t=>t.entryType!=="resource"||t.entryType!=="navigation")}getEntries(){return this._entries}getEntriesByName(t,r){return this._entries.filter(n=>n.name===t&&(!r||n.entryType===r))}getEntriesByType(t){return this._entries.filter(r=>r.entryType===t)}mark(t,r){let n=new le(t,r);return this._entries.push(n),n}measure(t,r,n){let s,a;typeof r=="string"?(s=this.getEntriesByName(r,"mark")[0]?.startTime,a=this.getEntriesByName(n,"mark")[0]?.startTime):(s=Number.parseFloat(r?.start)||this.now(),a=Number.parseFloat(r?.end)||this.now());let i=new U(t,{startTime:s,detail:{start:s,end:a}});return this._entries.push(i),i}setResourceTimingBufferSize(t){this._resourceTimingBufferSize=t}addEventListener(t,r,n){throw p("Performance.addEventListener")}removeEventListener(t,r,n){throw p("Performance.removeEventListener")}dispatchEvent(t){throw p("Performance.dispatchEvent")}toJSON(){return this}};l(W,"Performance");var k=class{__unenv__=!0;_callback=null;constructor(t){this._callback=t}takeRecords(){return[]}disconnect(){throw p("PerformanceObserver.disconnect")}observe(t){throw p("PerformanceObserver.observe")}bind(t){return t}runInAsyncScope(t,r,...n){return t.call(r,...n)}asyncId(){return 0}triggerAsyncId(){return 0}emitDestroy(){return this}};l(k,"PerformanceObserver"),xe(k,"supportedEntryTypes",[]);var Pe=globalThis.performance&&"addEventListener"in globalThis.performance?globalThis.performance:new W;globalThis.performance=Pe;globalThis.Performance=W;globalThis.PerformanceEntry=L;globalThis.PerformanceMark=le;globalThis.PerformanceMeasure=U;globalThis.PerformanceObserver=k;globalThis.PerformanceObserverEntryList=G;globalThis.PerformanceResourceTiming=B;import{Writable as Ie}from"node:stream";var R=Object.assign(()=>{},{__unenv__:!0});var g=globalThis.console,Me=!0,He=new Ie,ke=new Ie,K=g?.log??R,Ut=g?.info??K,xs=g?.trace??Ut,vs=g?.debug??K,Ps=g?.table??K,Bt=g?.error??K,Is=g?.warn??Bt,Ms=g?.createTask??D("console.createTask");var Hs=g?.clear??R,ks=g?.count??R,Us=g?.countReset??R,Bs=g?.dir??R,Ws=g?.dirxml??R,js=g?.group??R,Fs=g?.groupEnd??R,qs=g?.groupCollapsed??R,$s=g?.profile??R,Gs=g?.profileEnd??R,Ys=g?.time??R,Vs=g?.timeEnd??R,Js=g?.timeLog??R,Ks=g?.timeStamp??R,Ue=g?.Console??ve("console.Console"),Be=new Map;var We=R,je=R;var ue=globalThis.console,{assert:ra,clear:na,context:sa,count:aa,countReset:oa,createTask:ia,debug:ca,dir:la,dirxml:ua,error:da,group:_a,groupCollapsed:ha,groupEnd:ma,info:fa,log:pa,profile:Ea,profileEnd:ga,table:ya,time:Sa,timeEnd:wa,timeLog:Ra,timeStamp:Oa,trace:ba,warn:Ta}=ue;Object.assign(ue,{Console:Ue,_ignoreErrors:Me,_stderr:He,_stderrErrorHandler:je,_stdout:ke,_stdoutErrorHandler:We,_times:Be});var Fe=ue;globalThis.console=Fe;var qe=Object.assign(l(function(t){let r=Date.now(),n=Math.trunc(r/1e3),s=r%1e3*1e6;if(t){let a=n-t[0],i=s-t[0];return i<0&&(a=a-1,i=1e9+i),[a,i]}return[n,s]},"hrtime"),{bigint:l(function(){return BigInt(Date.now()*1e6)},"bigint")});import{EventEmitter as $e}from"node:events";import{Socket as Wt}from"node:net";var j=class extends Wt{fd;constructor(t){super(),this.fd=t}isRaw=!1;setRawMode(t){return this.isRaw=t,this}isTTY=!1};l(j,"ReadStream");import{Socket as jt}from"node:net";var P=class extends jt{fd;constructor(t){super(),this.fd=t}clearLine(t,r){return r&&r(),!1}clearScreenDown(t){return t&&t(),!1}cursorTo(t,r,n){return n&&typeof n=="function"&&n(),!1}moveCursor(t,r,n){return n&&n(),!1}getColorDepth(t){return 1}hasColors(t,r){return!1}getWindowSize(){return[this.columns,this.rows]}columns=80;rows=24;isTTY=!1};l(P,"WriteStream");var I=class extends $e{env;hrtime;nextTick;constructor(t){super(),this.env=t.env,this.hrtime=t.hrtime,this.nextTick=t.nextTick;for(let r of[...Object.getOwnPropertyNames(I.prototype),...Object.getOwnPropertyNames($e.prototype)]){let n=this[r];typeof n=="function"&&(this[r]=n.bind(this))}}emitWarning(t,r,n){console.warn(`${n?`[${n}] `:""}${r?`${r}: `:""}${t}`)}emit(...t){return super.emit(...t)}listeners(t){return super.listeners(t)}#t;#e;#r;get stdin(){return this.#t??=new j(0)}get stdout(){return this.#e??=new P(1)}get stderr(){return this.#r??=new P(2)}#a="/";chdir(t){this.#a=t}cwd(){return this.#a}arch="";platform="";argv=[];argv0="";execArgv=[];execPath="";title="";pid=200;ppid=100;get version(){return""}get versions(){return{}}get allowedNodeEnvironmentFlags(){return new Set}get sourceMapsEnabled(){return!1}get debugPort(){return 0}get throwDeprecation(){return!1}get traceDeprecation(){return!1}get features(){return{}}get release(){return{}}get connected(){return!1}get config(){return{}}get moduleLoadList(){return[]}constrainedMemory(){return 0}availableMemory(){return 0}uptime(){return 0}resourceUsage(){return{}}ref(){}unref(){}umask(){throw p("process.umask")}getBuiltinModule(){}getActiveResourcesInfo(){throw p("process.getActiveResourcesInfo")}exit(){throw p("process.exit")}reallyExit(){throw p("process.reallyExit")}kill(){throw p("process.kill")}abort(){throw p("process.abort")}dlopen(){throw p("process.dlopen")}setSourceMapsEnabled(){throw p("process.setSourceMapsEnabled")}loadEnvFile(){throw p("process.loadEnvFile")}disconnect(){throw p("process.disconnect")}cpuUsage(){throw p("process.cpuUsage")}setUncaughtExceptionCaptureCallback(){throw p("process.setUncaughtExceptionCaptureCallback")}hasUncaughtExceptionCaptureCallback(){throw p("process.hasUncaughtExceptionCaptureCallback")}initgroups(){throw p("process.initgroups")}openStdin(){throw p("process.openStdin")}assert(){throw p("process.assert")}binding(){throw p("process.binding")}permission={has:D("process.permission.has")};report={directory:"",filename:"",signal:"SIGUSR2",compact:!1,reportOnFatalError:!1,reportOnSignal:!1,reportOnUncaughtException:!1,getReport:D("process.report.getReport"),writeReport:D("process.report.writeReport")};finalization={register:D("process.finalization.register"),unregister:D("process.finalization.unregister"),registerBeforeExit:D("process.finalization.registerBeforeExit")};memoryUsage=Object.assign(()=>({arrayBuffers:0,rss:0,external:0,heapTotal:0,heapUsed:0}),{rss:()=>0});mainModule=void 0;domain=void 0;send=void 0;exitCode=void 0;channel=void 0;getegid=void 0;geteuid=void 0;getgid=void 0;getgroups=void 0;getuid=void 0;setegid=void 0;seteuid=void 0;setgid=void 0;setgroups=void 0;setuid=void 0;_events=void 0;_eventsCount=void 0;_exiting=void 0;_maxListeners=void 0;_debugEnd=void 0;_debugProcess=void 0;_fatalException=void 0;_getActiveHandles=void 0;_getActiveRequests=void 0;_kill=void 0;_preload_modules=void 0;_rawDebug=void 0;_startProfilerIdleNotifier=void 0;_stopProfilerIdleNotifier=void 0;_tickCallback=void 0;_disconnect=void 0;_handleQueue=void 0;_pendingMessage=void 0;_channel=void 0;_send=void 0;_linkedBinding=void 0};l(I,"Process");var Ge=globalThis.process,Ye=Ge.getBuiltinModule,{exit:Ft,platform:qt,nextTick:Ve}=Ye("node:process"),$t=new I({env:Ge.env,hrtime:qe,nextTick:Ve}),{abort:Gt,addListener:Yt,allowedNodeEnvironmentFlags:Vt,hasUncaughtExceptionCaptureCallback:Jt,setUncaughtExceptionCaptureCallback:Kt,loadEnvFile:Qt,sourceMapsEnabled:zt,arch:Xt,argv:Zt,argv0:er,chdir:tr,config:rr,connected:nr,constrainedMemory:sr,availableMemory:ar,cpuUsage:or,cwd:ir,debugPort:cr,dlopen:lr,disconnect:ur,emit:dr,emitWarning:_r,env:hr,eventNames:mr,execArgv:fr,execPath:pr,finalization:Er,features:gr,getActiveResourcesInfo:yr,getMaxListeners:Sr,hrtime:wr,kill:Rr,listeners:Or,listenerCount:br,memoryUsage:Tr,on:Ar,off:Nr,once:Dr,pid:Cr,ppid:Lr,prependListener:xr,prependOnceListener:vr,rawListeners:Pr,release:Ir,removeAllListeners:Mr,removeListener:Hr,report:kr,resourceUsage:Ur,setMaxListeners:Br,setSourceMapsEnabled:Wr,stderr:jr,stdin:Fr,stdout:qr,title:$r,throwDeprecation:Gr,traceDeprecation:Yr,umask:Vr,uptime:Jr,version:Kr,versions:Qr,domain:zr,initgroups:Xr,moduleLoadList:Zr,reallyExit:en,openStdin:tn,assert:rn,binding:nn,send:sn,exitCode:an,channel:on,getegid:cn,geteuid:ln,getgid:un,getgroups:dn,getuid:_n,setegid:hn,seteuid:mn,setgid:fn,setgroups:pn,setuid:En,permission:gn,mainModule:yn,_events:Sn,_eventsCount:wn,_exiting:Rn,_maxListeners:On,_debugEnd:bn,_debugProcess:Tn,_fatalException:An,_getActiveHandles:Nn,_getActiveRequests:Dn,_kill:Cn,_preload_modules:Ln,_rawDebug:xn,_startProfilerIdleNotifier:vn,_stopProfilerIdleNotifier:Pn,_tickCallback:In,_disconnect:Mn,_handleQueue:Hn,_pendingMessage:kn,_channel:Un,_send:Bn,_linkedBinding:Wn}=$t,jn={abort:Gt,addListener:Yt,allowedNodeEnvironmentFlags:Vt,hasUncaughtExceptionCaptureCallback:Jt,setUncaughtExceptionCaptureCallback:Kt,loadEnvFile:Qt,sourceMapsEnabled:zt,arch:Xt,argv:Zt,argv0:er,chdir:tr,config:rr,connected:nr,constrainedMemory:sr,availableMemory:ar,cpuUsage:or,cwd:ir,debugPort:cr,dlopen:lr,disconnect:ur,emit:dr,emitWarning:_r,env:hr,eventNames:mr,execArgv:fr,execPath:pr,exit:Ft,finalization:Er,features:gr,getBuiltinModule:Ye,getActiveResourcesInfo:yr,getMaxListeners:Sr,hrtime:wr,kill:Rr,listeners:Or,listenerCount:br,memoryUsage:Tr,nextTick:Ve,on:Ar,off:Nr,once:Dr,pid:Cr,platform:qt,ppid:Lr,prependListener:xr,prependOnceListener:vr,rawListeners:Pr,release:Ir,removeAllListeners:Mr,removeListener:Hr,report:kr,resourceUsage:Ur,setMaxListeners:Br,setSourceMapsEnabled:Wr,stderr:jr,stdin:Fr,stdout:qr,title:$r,throwDeprecation:Gr,traceDeprecation:Yr,umask:Vr,uptime:Jr,version:Kr,versions:Qr,domain:zr,initgroups:Xr,moduleLoadList:Zr,reallyExit:en,openStdin:tn,assert:rn,binding:nn,send:sn,exitCode:an,channel:on,getegid:cn,geteuid:ln,getgid:un,getgroups:dn,getuid:_n,setegid:hn,seteuid:mn,setgid:fn,setgroups:pn,setuid:En,permission:gn,mainModule:yn,_events:Sn,_eventsCount:wn,_exiting:Rn,_maxListeners:On,_debugEnd:bn,_debugProcess:Tn,_fatalException:An,_getActiveHandles:Nn,_getActiveRequests:Dn,_kill:Cn,_preload_modules:Ln,_rawDebug:xn,_startProfilerIdleNotifier:vn,_stopProfilerIdleNotifier:Pn,_tickCallback:In,_disconnect:Mn,_handleQueue:Hn,_pendingMessage:kn,_channel:Un,_send:Bn,_linkedBinding:Wn},Je=jn;globalThis.process=Je;var Ke=Symbol();var Qe=l((e,t)=>new Response(e,{headers:{"Content-Type":t.replace(/^[^;]+/,r=>r.toLowerCase())}}).formData(),"bufferToFormData");var Fn=1e4,Q=l(e=>"headers"in e,"isRawRequest"),Ze=l(async(e,t=Object.create(null))=>{let{all:r=!1,dot:n=!1}=t,s=(Q(e)?e.headers:e.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();return s==="multipart/form-data"||s==="application/x-www-form-urlencoded"?qn(e,{all:r,dot:n}):{}},"parseBody");async function qn(e,t){if(!Q(e)&&e.bodyCache.formData)return ze(await e.bodyCache.formData,t);let r=Q(e)?e.headers:e.raw.headers,n=await e.arrayBuffer(),s=Qe(n,r.get("Content-Type")||"");Q(e)||(e.bodyCache.formData=s);let a=await s;return a?ze(a,t):{}}l(qn,"parseFormData");function ze(e,t){let r=Object.create(null),n={count:0};return e.forEach((s,a)=>{t.all||a.endsWith("[]")?$n(r,a,s):r[a]=s}),t.dot&&Object.entries(r).forEach(([s,a])=>{s.includes(".")&&(Gn(r,s,a,n),delete r[s])}),r}l(ze,"convertFormDataToBodyData");var $n=l((e,t,r)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(r):e[t]=[e[t],r]:t.endsWith("[]")?e[t]=[r]:e[t]=r},"handleParsingAllValues"),Gn=l((e,t,r,n)=>{if(/(?:^|\.)__proto__\./.test(t))return;let s=e,a=t.split(".",34);a.length>33&&Xe(),a.forEach((i,o)=>{o===a.length-1?s[i]=r:((!s[i]||typeof s[i]!="object"||Array.isArray(s[i])||s[i]instanceof File)&&(n.count++>=Fn&&Xe(),s[i]=Object.create(null)),s=s[i])})},"handleParsingNestedValues"),Xe=l(()=>{throw new Error("Nesting limit exceeded")},"throwNestingLimitExceeded");var _e=l(e=>{let t=e.split("/");return t[0]===""&&t.shift(),t},"splitPath"),et=l(e=>{let{groups:t,path:r}=Yn(e),n=_e(r);return Vn(n,t)},"splitRoutingPath"),Yn=l(e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(r,n)=>{let s=`@${n}`;return t.push([s,r]),s}),{groups:t,path:e}},"extractGroupsFromPath"),Vn=l((e,t)=>{for(let r=t.length-1;r>=0;r--){let[n]=t[r];for(let s=e.length-1;s>=0;s--)if(e[s].includes(n)){e[s]=e[s].replace(n,t[r][1]);break}}return e},"replaceGroupMarks"),z={},tt=l((e,t)=>{if(e==="*")return"*";let r=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){let n=`${e}#${t}`;return z[n]||(r[2]?z[n]=t&&t[0]!==":"&&t[0]!=="*"?[n,r[1],new RegExp(`^${r[2]}(?=/${t})`)]:[e,r[1],new RegExp(`^${r[2]}$`)]:z[n]=[e,r[1],!0]),z[n]}return null},"getPattern"),rt=l((e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return t(r)}catch{return r}})}},"tryDecode"),Jn=l(e=>rt(e,decodeURI),"tryDecodeURI"),he=l(e=>{let t=e.url,r=t.indexOf("/",t.indexOf(":")+4),n=r;for(;n<t.length;n++){let s=t.charCodeAt(n);if(s===37){let a=t.indexOf("?",n),i=t.indexOf("#",n),o=a===-1?i===-1?void 0:i:i===-1?a:Math.min(a,i),c=t.slice(r,o);return Jn(c.includes("%25")?c.replace(/%25/g,"%2525"):c)}else if(s===63||s===35)break}return t.slice(r,n)},"getPath");var nt=l(e=>{let t=he(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},"getPathNoStrict"),x=l((e,t,...r)=>(r.length&&(t=x(t,...r)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`),"mergePath"),X=l(e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;let t=e.split("/"),r=[],n="";return t.forEach(s=>{if(s!==""&&!/\:/.test(s))n+="/"+s;else if(/\:/.test(s))if(s.charCodeAt(s.length-1)===63){r.length===0&&n===""?r.push("/"):r.push(n);let a=s.slice(0,-1);n+="/"+a,r.push(n)}else n+="/"+s}),r.filter((s,a,i)=>i.indexOf(s)===a)},"checkOptionalParameter"),Z=l(e=>e.indexOf("%")!==-1?rt(e,Kn):e,"tryDecodeURIComponent"),de=l(e=>(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),Z(e)),"_decodeURI"),st=l((e,t,r)=>{let n=e.indexOf("#",8);n!==-1&&(e=e.slice(0,n));let s;if(!r&&t&&t.indexOf("%")===-1&&t.indexOf("+")===-1){let o=e.indexOf("?",8);if(o===-1)return;for(e.startsWith(t,o+1)||(o=e.indexOf(`&${t}`,o+1));o!==-1;){let c=e.charCodeAt(o+t.length+1);if(c===61){let u=o+t.length+2,d=e.indexOf("&",u);return de(e.slice(u,d===-1?void 0:d))}else if(c==38||isNaN(c))return"";o=e.indexOf(`&${t}`,o+1)}if(s=/[%+]/.test(e),!s)return}let a=Object.create(null);s??=/[%+]/.test(e);let i=e.indexOf("?",8);for(;i!==-1;){let o=e.indexOf("&",i+1),c=e.indexOf("=",i);c>o&&o!==-1&&(c=-1);let u=e.slice(i+1,c===-1?o===-1?void 0:o:c);if(s&&(u=de(u)),i=o,u==="")continue;let d;c===-1?d="":(d=e.slice(c+1,o===-1?void 0:o),s&&(d=de(d))),r?(a[u]&&Array.isArray(a[u])||(a[u]=[]),a[u].push(d)):a[u]??=d}return t?a[t]:a},"_getQueryParam"),at=st,ot=l((e,t)=>st(e,t,!0),"getQueryParams"),Kn=decodeURIComponent;var it=l(class{raw;#t;#e;routeIndex=0;path;bodyCache={};constructor(e,t="/",r=[[]]){this.raw=e,this.path=t,this.#e=r}param(e){return e?this.#r(e):this.#a()}#r(e){let t=this.#e[0][this.routeIndex]?.[1][e],r=this.#n(t);return r&&Z(r)}#a(){let e={},t=Object.keys(this.#e[0][this.routeIndex]?.[1]??{});for(let r of t){let n=this.#n(this.#e[0][this.routeIndex][1][r]);n!==void 0&&(e[r]=Z(n))}return e}#n(e){return this.#e[1]?this.#e[1][e]:e}query(e){return at(this.url,e)}queries(e){return ot(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t=Object.create(null);return this.raw.headers.forEach((r,n)=>{t[n]=r}),t}async parseBody(e){return Ze(this,e)}#s=e=>{let{bodyCache:t,raw:r}=this,n=t[e];if(n)return n;for(let s in t)return t[s].then(a=>{s==="json"&&(a=JSON.stringify(a));let i=s==="formData"?void 0:r.headers.get("content-type");return new Response(a,{headers:i?{"Content-Type":i}:void 0})[e]()});return t[e]=r[e]()};json(){return this.#s("text").then(e=>JSON.parse(e))}text(){return this.#s("text")}arrayBuffer(){return this.#s("arrayBuffer")}bytes(){return this.#s("arrayBuffer").then(e=>new Uint8Array(e))}blob(){return this.#s("blob")}formData(){return this.#s("formData")}addValidatedData(e,t){(this.#t??={})[e]=t}valid(e){return this.#t?.[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[Ke](){return this.#e}get matchedRoutes(){return this.#e[0].map(([[,e]])=>e)}get routePath(){return this.#e[0].map(([[,e]])=>e)[this.routeIndex].path}},"HonoRequest");var ct={Stringify:1,BeforeStream:2,Stream:3},Qn=l((e,t)=>{let r=new String(e);return r.isEscaped=!0,r.callbacks=t,r},"raw");var me=l(async(e,t,r,n,s)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let a=e.callbacks;if(!a?.length)return Promise.resolve(e);s?s[0]+=e:s=[e];let i=Promise.all(a.map(o=>o({phase:t,buffer:s,context:n}))).then(o=>Promise.all(o.filter(Boolean).map(c=>me(c,t,!1,n,s))).then(()=>s[0]));return r?Qn(await i,a):i},"resolveCallback");var zn="text/plain; charset=UTF-8",fe=l((e,t)=>({"Content-Type":e,...t}),"setDefaultContentType"),Y=l((e,t)=>new Response(e,t),"createResponseInstance"),pe=l(class{#t;#e;env={};#r;finalized=!1;error;#a;#n;#s;#u;#c;#l;#i;#d;#_;constructor(e,t){this.#t=e,t&&(this.#n=t.executionCtx,this.env=t.env,this.#l=t.notFoundHandler,this.#_=t.path,this.#d=t.matchResult)}get req(){return this.#e??=new it(this.#t,this.#_,this.#d),this.#e}get event(){if(this.#n&&"respondWith"in this.#n)return this.#n;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#n)return this.#n;throw Error("This context has no ExecutionContext")}get res(){return this.#s||=Y(null,{headers:this.#i??=new Headers})}set res(e){if(this.#s&&e){e=Y(e.body,e);for(let[t,r]of this.#s.headers.entries())if(t!=="content-type")if(t==="set-cookie"){let n=this.#s.headers.getSetCookie();e.headers.delete("set-cookie");for(let s of n)e.headers.append("set-cookie",s)}else e.headers.set(t,r)}this.#s=e,this.finalized=!0}render=(...e)=>(this.#c??=t=>this.html(t),this.#c(...e));setLayout=e=>this.#u=e;getLayout=()=>this.#u;setRenderer=e=>{this.#c=e};header=(e,t,r)=>{this.finalized&&(this.#s=Y(this.#s.body,this.#s));let n=this.#s?this.#s.headers:this.#i??=new Headers;t===void 0?n.delete(e):r?.append?n.append(e,t):n.set(e,t)};status=e=>{this.#a=e};set=(e,t)=>{this.#r??=new Map,this.#r.set(e,t)};get=e=>this.#r?this.#r.get(e):void 0;get var(){return this.#r?Object.fromEntries(this.#r):{}}#o(e,t,r){let n=this.#s?new Headers(this.#s.headers):this.#i;if(typeof t=="object"&&t.headers){n??=new Headers;for(let[a,i]of new Headers(t.headers))a==="set-cookie"?n.append(a,i):n.set(a,i)}if(r){if(!n){let a=0;for(let i in r)if(++a>1||typeof r[i]!="string"){n=new Headers;break}}if(n)for(let a in r){let i=r[a];if(typeof i=="string")n.set(a,i);else{n.delete(a);for(let o of i)n.append(a,o)}}}let s=typeof t=="number"?t:t?.status??this.#a;return Y(e,{status:s,headers:n??r})}newResponse=(...e)=>this.#o(...e);body=(e,t,r)=>this.#o(e,t,r);text=(e,t,r)=>!this.#i&&!this.#a&&!t&&!r&&!this.finalized?new Response(e):this.#o(e,t,fe(zn,r));json=(e,t,r)=>this.#o(JSON.stringify(e),t,fe("application/json",r));html=(e,t,r)=>{let n=l(s=>this.#o(s,t,fe("text/html; charset=UTF-8",r)),"res");return typeof e=="object"?me(e,ct.Stringify,!1,{}).then(n):n(e)};redirect=(e,t)=>{let r=String(e);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,t??302)};notFound=()=>(this.#l??=()=>Y(),this.#l(this))},"Context");var Ee=l((e,t,r)=>(n,s)=>{let a=-1;return i(0);async function i(o){if(o<=a)throw new Error("next() called multiple times");a=o;let c,u=!1,d;if(e[o]?(d=e[o][0][0],n.req.routeIndex=o):d=o===e.length&&s||void 0,d)try{c=await d(n,()=>i(o+1))}catch(h){if(h instanceof Error&&t)n.error=h,c=await t(h,n),u=!0;else throw h}else n.finalized===!1&&r&&(c=await r(n));return c&&(n.finalized===!1||u)&&(n.res=c),n}},"compose");var lt=["get","post","put","delete","options","patch","query"],ee="Can not add a route since the matcher is already built.",te=l(class extends Error{},"UnsupportedPathError");var ut="__COMPOSED_HANDLER";var Xn=l(e=>e.text("404 Not Found",404),"notFoundHandler"),dt=l((e,t)=>{if("getResponse"in e){let r=e.getResponse();return t.newResponse(r.body,r)}return console.error(e),t.text("Internal Server Error",500)},"errorHandler"),_t=l(class ht{get;post;put;delete;options;patch;query;all;on;use;router;getPath;_basePath="/";#t="/";routes=[];constructor(t={}){[...lt,"all"].forEach(s=>{this[s]=(a,...i)=>{let o=s.toUpperCase();return typeof a=="string"?this.#t=a:this.#a(o,this.#t,a),i.forEach(c=>{this.#a(o,this.#t,c)}),this}}),this.on=(s,a,...i)=>{for(let o of[a].flat()){this.#t=o;for(let c of[s].flat()){let u=c.toUpperCase();for(let d of i)this.#a(u,this.#t,d)}}return this},this.use=(s,...a)=>(typeof s=="string"?this.#t=s:(this.#t="*",a.unshift(s)),a.forEach(i=>{this.#a("ALL",this.#t,i)}),this);let{strict:r,...n}=t;Object.assign(this,n),this.getPath=r??!0?t.getPath??he:nt}#e(){let t=new ht({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,t.#r=this.#r,t.routes=this.routes,t}#r=Xn;errorHandler=dt;route(t,r){let n=this.basePath(t);return r.routes.map(s=>{let a;r.errorHandler===dt?a=s.handler:(a=l(async(i,o)=>(await Ee([],r.errorHandler)(i,()=>s.handler(i,o))).res,"handler"),a[ut]=s.handler),n.#a(s.method,s.path,a,s.basePath)}),this}basePath(t){let r=this.#e();return r._basePath=x(this._basePath,t),r}onError=t=>(this.errorHandler=t,this);notFound=t=>(this.#r=t,this);mount(t,r,n){let s,a;n&&(typeof n=="function"?a=n:(a=n.optionHandler,n.replaceRequest===!1?s=l(c=>c,"replaceRequest"):s=n.replaceRequest));let i=a?c=>{let u=a(c);return Array.isArray(u)?u:[u]}:c=>{let u;try{u=c.executionCtx}catch{}return[c.env,u]};s||=(()=>{let c=x(this._basePath,t),u=c==="/"?0:c.length;return d=>{let h=new URL(d.url);return h.pathname=this.getPath(d).slice(u)||"/",new Request(h,d)}})();let o=l(async(c,u)=>{let d=await r(s(c.req.raw),...i(c));if(d)return d;await u()},"handler");return this.#a("ALL",x(t,"*"),o),this}#a(t,r,n,s){r=x(this._basePath,r);let a={basePath:s!==void 0?x(this._basePath,s):this._basePath,path:r,method:t,handler:n};this.router.add(t,r,[n,a]),this.routes.push(a)}#n(t,r){if(t instanceof Error)return this.errorHandler(t,r);throw t}#s(t,r,n,s){if(s==="HEAD")return(async()=>new Response(null,await this.#s(t,r,n,"GET")))();let a=this.getPath(t,{env:n}),i=this.router.match(s,a),o=new pe(t,{path:a,matchResult:i,env:n,executionCtx:r,notFoundHandler:this.#r});if(i[0].length===1){let u;try{u=i[0][0][0][0](o,async()=>{o.res=await this.#r(o)})}catch(d){return this.#n(d,o)}return u instanceof Promise?u.then(d=>d||(o.finalized?o.res:this.#r(o))).catch(d=>this.#n(d,o)):u??this.#r(o)}let c=Ee(i[0],this.errorHandler,this.#r);return(async()=>{try{let u=await c(o);if(!u.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return u.res}catch(u){return this.#n(u,o)}})()}fetch=(t,...r)=>this.#s(t,r[1],r[0],t.method);request=(t,r,n,s)=>t instanceof Request?this.fetch(r?new Request(t,r):t,n,s):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${x("/",t)}`,r),n,s));fire=()=>{addEventListener("fetch",t=>{t.respondWith(this.#s(t.request,t,void 0,t.request.method))})}},"Hono");var O=l(()=>Object.create(null),"createNullObject");var re=[];function ge(e,t){let r=this.buildAllMatchers(),n=l((s,a)=>{let i=r[s]||r.ALL,o=i[2][a];if(o)return o;let c=a.match(i[0]);if(!c)return[[],re];let u=c.indexOf("",1);return[i[1][u],c]},"match");return this.match=n,n(e,t)}l(ge,"match");var Se="[^/]+";var we="(?:|/.*)",v=Symbol(),mt=new Set(".\\+*[^]$()");function Zn(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1?1:e===".*"||e==="(?:|/.*)"?t==="(?:|/.*)"?-1:1:t===".*"||t==="(?:|/.*)"?-1:e==="[^/]+"?1:t==="[^/]+"?-1:e.length===t.length?e<t?-1:1:t.length-e.length}l(Zn,"compareKey");var ft=l(class ye{#t;#e;#r=O();insert(t,r,n,s,a){let i=this;for(let o=0,c=t.length;o<c;o++){let u=t[o],d=u.length===1?u==="*"?o===c-1?["","",".*"]:["","",Se]:null:u==="/*"?["","",we]:u.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),h;if(d){let _=d[1],m=d[2]||"[^/]+";if(_&&d[2]&&(m===".*"||(m=m.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(m))||m.length===1&&mt.has(m)))throw v;if(h=i.#r[m],!h){if(m!==".*"&&m!=="(?:|/.*)"){for(let E in i.#r)if((m.length>1||E.length>1)&&E!==".*"&&E!=="(?:|/.*)")throw v}h=i.#r[m]=new ye}_!==""&&(h.#e??=s.varIndex++,n.push([_,h.#e]))}else if(h=i.#r[u],!h){for(let _ in i.#r)if(_.length>1&&_!==".*"&&_!=="(?:|/.*)")throw v;h=i.#r[u]=new ye}i=h}if(i.#t!==void 0)throw v;i.#t=a?-1:r}buildRegExpStr(){let t=Object.keys(this.#r).sort(Zn).map(r=>{let n=this.#r[r],s=n.buildRegExpStr();return s===""?"":(typeof n.#e=="number"?`(${r})@${n.#e}`:mt.has(r)?`\\${r}`:r)+s}).filter(Boolean);return typeof this.#t=="number"&&this.#t!==-1&&t.unshift(`#${this.#t}`),t.length===0?"":t.length===1?t[0]:"(?:"+t.join("|")+")"}},"Node");var Re=l(class{#t={varIndex:0};#e=new ft;#r=0;paths=O();insert(e,t){if(t){this.#e.insert(e.split(""),0,[],this.#t,!0);return}let r=[],n=[],s=e;for(let i=0;;){let o=!1;if(s=s.replace(/\{[^}]+\}/g,c=>{let u=`@\\${i}`;return n[i]=[u,c],i++,o=!0,u}),!o)break}let a=s.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let i=n.length-1;i>=0;i--){let[o]=n[i];for(let c=a.length-1;c>=0;c--)if(a[c].indexOf(o)!==-1){a[c]=a[c].replace(o,n[i][1]);break}}this.#e.insert(a,this.#r,r,this.#t,!1),this.paths[e]=[this.#r++,r]}buildRegExp(){let e=this.#e.buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0,r=[],n=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(s,a,i)=>a!==void 0?(r[++t]=Number(a),"$()"):(i!==void 0&&(n[Number(i)]=++t),"")),[new RegExp(`^${e}`),r,n]}},"Trie");var pt=O();function Et(e){return pt[e]??=new RegExp(`^${e.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,(t,r)=>r?`\\${r}`:t==="/*"?we:t==="*"?".*":`/:${Se}`)}$`)}l(Et,"buildWildcardRegExp");function ne(e,t){for(let r of Object.keys(e).sort((n,s)=>s.length-n.length))if(Et(r).test(t))return[...e[r]]}l(ne,"findMiddleware");var se=l(class{name="RegExpRouter";#t;#e;#r;constructor(){this.#t={ALL:O()},this.#e={ALL:O()},this.#r={ALL:new Re}}#a(e,t){try{this.#r[e].insert(t,!/\*|\/:/.test(t))}catch(r){throw r===v?new te(t):r}}add(e,t,r){let n=this.#t,s=this.#e;if(!n)throw new Error(ee);if(!n[e]){this.#r[e]=new Re;for(let o of[n,s]){o[e]=O();for(let c in o.ALL)o[e][c]=[...o.ALL[c]],this.#a(e,c)}}t==="/*"&&(t="*");let a=e==="ALL"?Object.keys(n):[e];if(/\*$/.test(t)){let o=Et(t);for(let c of a)n[c][t]||(this.#a(c,t),n[c][t]=ne(n[c],t)||ne(n.ALL,t)||[]);for(let c of[n,s])for(let u of a)for(let d in c[u])o.test(d)&&c[u][d].push([r,t]);return}let i=X(t)||[t];for(let o of i)for(let c of a)s[c][o]||(this.#a(c,o),s[c][o]=ne(n[c],o)||ne(n.ALL,o)||[]),s[c][o].push([r,o])}match=ge;buildAllMatchers(){let e=O();for(let t of Object.keys(this.#e))e[t]=this.#n(t);return this.#t=this.#e=this.#r=void 0,pt=O(),e}#n(e){let t=this.#t[e],r=this.#e[e],n=this.#r[e],s=O(),a=[],[i,o,c]=n.buildRegExp();for(let u of[t,r])for(let d in u){let h=u[d],_=n.paths[d];if(!_){s[d]=[h.map(([m])=>[m,O()]),re];continue}a[_[0]]=h.map(([m,E])=>[m,n.paths[E][1].reduceRight((T,[S],A)=>(T[S]=c[_[1][A][1]],T),O())])}return[i,o.map(u=>a[u]),s]}},"RegExpRouter");var gt=l(class{name="SmartRouter";#t=[];#e=[];constructor(e){this.#t=e.routers}add(e,t,r){if(!this.#e)throw new Error(ee);this.#e.push([e,t,r])}match(e,t){if(!this.#e)throw new Error("Fatal error");let r=this.#t,n=this.#e,s=r.length,a=0,i;for(;a<s;a++){let o=r[a];try{for(let c=0,u=n.length;c<u;c++)o.add(...n[c]);i=o.match(e,t)}catch(c){if(c instanceof te)continue;throw c}this.match=o.match.bind(o),this.#t=[o],this.#e=void 0;break}if(a===s)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,i}get activeRouter(){if(this.#e||this.#t.length!==1)throw new Error("No active router has been determined yet.");return this.#t[0]}},"SmartRouter");var Oe=O(),es=0,yt=l(class St{#t=[];#e=O();#r=[];#a;#n=Oe;insert(t,r,n){let s=this,a=et(r),i=new Set,o=0;for(let c of a){let u=a[++o],d=tt(c,u)||(u===void 0&&c&&c.indexOf("*")===c.length-1?c:null),h=Array.isArray(d),_=h?d[0]:d||c,m=s.#e[_]||=new St;d&&!m.#a&&(m.#a=d,s.#r.push(m)),s=m,h&&i.add(d[1])}s.#t.push({[t]:{handler:n,possibleKeys:[...i],score:++es}})}#s(t,r,n,s,a){for(let i=0,o=r.#t.length;i<o;i++){let c=r.#t[i],u=c[n]||c.ALL;if(u){u.params=O(),t.push(u);for(let d=0,h=u.possibleKeys.length;d<h;d++){let _=u.possibleKeys[d];u.params[_]=a?.[_]&&!d?a[_]:s[_]??a?.[_]}}}}search(t,r){let n=[];this.#n=Oe;let s=[this],a=_e(r),i=[],o=a.length,c=null;for(let u=0;u<o;u++){let d=a[u],h=u===o-1,_=[];for(let E=0,T=s.length;E<T;E++){let S=s[E],A=S.#e[d];A&&(A.#n=S.#n,h?(A.#e["*"]&&this.#s(n,A.#e["*"],t,S.#n),this.#s(n,A,t,S.#n)):_.push(A));for(let w of S.#r){let C=w.#a,b=S.#n===Oe?{}:{...S.#n};if(typeof C=="string"){(C==="*"||d.startsWith(C.slice(0,-1)))&&(this.#s(n,w,t,S.#n),C==="*"&&(w.#n=b,_.push(w)));continue}let[,$,N]=C;if(!(!d&&N===!0)){if(N!==!0){if(!c){c=[];let oe=r[0]==="/"?1:0;for(let H=0;H<o;H++)c[H]=oe,oe+=a[H].length+1}let Ce=r.slice(c[u]),J=N.exec(Ce);if(J){b[$]=J[0],this.#s(n,w,t,S.#n,b),J[0].length===Ce.length&&w.#e["*"]&&this.#s(n,w.#e["*"],t,S.#n,b);for(let oe in w.#e){w.#n=b;let H=J[0].match(/\//g)?.length??0;(i[H]||=[]).push(w);break}continue}}(N===!0||N.test(d))&&(b[$]=d,h?(this.#s(n,w,t,b,S.#n),w.#e["*"]&&this.#s(n,w.#e["*"],t,b,S.#n)):(w.#n=b,_.push(w)))}}}let m=i.shift();s=m?_.concat(m):_}return n[1]&&n.sort((u,d)=>u.score-d.score),[n.map(({handler:u,params:d})=>[u,d])]}},"Node");var be=l(class{name="TrieRouter";#t=new yt;add(e,t,r){for(let n of X(t)||[t])this.#t.insert(e,n,r)}match(e,t){return this.#t.search(e,t)}},"TrieRouter");var Te=l(class extends _t{constructor(e={}){super(e),this.router=e.router??new gt({routers:[new se,new be]})}},"Hono");var wt=l(e=>{let t={origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH","QUERY"],allowHeaders:[],exposeHeaders:[],...e},r=t.exposeHeaders?.length?t.exposeHeaders.join(","):void 0,n=t.allowHeaders?.length?t.allowHeaders.join(","):void 0,s=(i=>typeof i=="string"?i==="*"?()=>i:o=>i===o?o:null:typeof i=="function"?i:o=>i.includes(o)?o:null)(t.origin),a=(i=>{if(typeof i=="function")return async(o,c)=>(await i(o,c)).join(",");if(Array.isArray(i)){let o=i.join(",");return()=>o}else return()=>""})(t.allowMethods);return l(async function(o,c){function u(h,_){o.res.headers.set(h,_)}l(u,"set");let d=await s(o.req.header("origin")||"",o);if(d&&u("Access-Control-Allow-Origin",d),t.credentials&&u("Access-Control-Allow-Credentials","true"),r&&u("Access-Control-Expose-Headers",r),o.req.method==="OPTIONS"){t.origin!=="*"&&o.res.headers.append("Vary","Origin"),t.maxAge!=null&&u("Access-Control-Max-Age",t.maxAge.toString());let h=await a(o.req.header("origin")||"",o);h&&u("Access-Control-Allow-Methods",h);let _=n;if(!_){let m=o.req.header("Access-Control-Request-Headers");m&&(_=m.split(",").map(E=>E.trim()).join(","))}return _&&(u("Access-Control-Allow-Headers",_),o.res.headers.append("Vary","Access-Control-Request-Headers")),o.res.headers.delete("Content-Length"),o.res.headers.delete("Content-Type"),new Response(null,{headers:o.res.headers,status:204,statusText:"No Content"})}await c(),t.origin!=="*"&&o.header("Vary","Origin",{append:!0})},"cors")},"cors");async function F(e){let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(r=>r.toString(16).padStart(2,"0")).join("")}l(F,"sha256");async function Rt(e,t){let r=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveBits"]),n=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(t),iterations:1e5,hash:"SHA-256"},r,256);return Array.from(new Uint8Array(n)).map(s=>s.toString(16).padStart(2,"0")).join("")}l(Rt,"pbkdf2Hash");function Ot(e=32){let t=new Uint8Array(e);return crypto.getRandomValues(t),Array.from(t).map(r=>r.toString(16).padStart(2,"0")).join("")}l(Ot,"randomHex");function ts(){return Ot(16)}l(ts,"randomSalt");async function Ae(e,t){return F(e+":"+t)}l(Ae,"hashSyncKey");async function V(e,t,r,n,s,a,i){
  let o=t.trim().toLowerCase(),c=await Ae(n.trim(),s),u=a?await F(a.trim()+":"+s):null,d=i?i.trim().toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,32):null;
  let h=null;
  try {
    h=await e.prepare("SELECT id, branch_name, sync_key_hash, slug, pin_hash FROM stores WHERE LOWER(id) = ?").bind(o).first();
  } catch(err) {
    console.warn("D1 store query failed in V:", err?.message||err);
  }
  if (!h) {
    try {
      await e.prepare("INSERT INTO stores (id, branch_name, sync_key_hash, pin_hash, slug, last_sync_at) VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET branch_name=excluded.branch_name, sync_key_hash=excluded.sync_key_hash, last_sync_at=datetime('now')").bind(o,r.trim()||"My Store",c,u,d).run();
    } catch(err) {
      console.warn("D1 store insert in V skipped:", err?.message||err);
    }
    return {ok:!0,branchName:r.trim()||"My Store",slug:d||void 0};
  }
  if (h.sync_key_hash && h.sync_key_hash!==c) return {ok:!1};
  let _=d||h.slug,m=u||h.pin_hash;
  try {
    await e.prepare(`UPDATE stores SET branch_name = ?, pin_hash = COALESCE(?, pin_hash), slug = COALESCE(?, slug), last_sync_at = datetime('now'), id = LOWER(id) WHERE LOWER(id) = ?`).bind(r.trim()||h.branch_name,m,_,o).run();
  } catch(err) {}
  return {ok:!0,branchName:h.branch_name||r.trim()||"My Store",slug:_||void 0};
}l(V,"authenticateOrRegisterStore");var rs=24*60*60*1e3;async function Ne(e,t,r,n){let s=Date.now()+rs,a=`${t}:${r.toLowerCase()}:${s}`,i=new TextEncoder,o=await crypto.subtle.importKey("raw",i.encode(n),{name:"HMAC",hash:"SHA-256"},!1,["sign"]),c=await crypto.subtle.sign("HMAC",o,i.encode(a)),u=Array.from(new Uint8Array(c)).map(h=>h.toString(16).padStart(2,"0")).join(""),d=`v2.${t}.${r.toLowerCase()}.${s}.${u}`;try{let h=Ot(32),_=await F(h);await e.prepare("INSERT INTO owner_sessions (owner_user_id, token_hash, expires_at) VALUES (?, ?, ?)").bind(t,_,new Date(s).toISOString()).run()}catch(h){console.warn("D1 session insert skipped (quota or read-only):",h)}return d}l(Ne,"createOwnerSession");async function bt(e,t,r){if(!t)return null;if(t.startsWith("v2.")){let n=t.split(".");if(n.length===5){let[,s,a,i,o]=n,c=parseInt(s,10),u=parseInt(i,10);if(isNaN(c)||isNaN(u)||Date.now()>u)return null;let d=`${c}:${a.toLowerCase()}:${u}`,h=new TextEncoder,_=await crypto.subtle.importKey("raw",h.encode(r),{name:"HMAC",hash:"SHA-256"},!1,["verify"]),m=new Uint8Array(o.match(/.{1,2}/g)?.map(T=>parseInt(T,16))||[]);if(await crypto.subtle.verify("HMAC",_,m,h.encode(d)))return c}}try{let n=await F(t),s=await e.prepare("SELECT owner_user_id, expires_at FROM owner_sessions WHERE token_hash = ?").bind(n).first();if(!s)return null;if(new Date(s.expires_at).getTime()<Date.now()){try{await e.prepare("DELETE FROM owner_sessions WHERE token_hash = ?").bind(n).run()}catch{}return null}return s.owner_user_id}catch(n){return console.warn("D1 session validate error:",n),null}}l(bt,"validateOwnerSession");function Tt(e){return e?.startsWith("Bearer ")&&e.slice(7).trim()||null}l(Tt,"extractBearer");async function De(e,t,r){let n=t.trim().toLowerCase();try{let s=await e.prepare("SELECT id, username, password_hash, password_salt FROM owner_users WHERE username = ?").bind(n).first();if(s)return r&&r.put(`owners/${n}.json`,JSON.stringify(s),{httpMetadata:{contentType:"application/json"}}).catch(a=>console.warn("R2 owner cache failed:",a)),s}catch(s){console.warn("D1 findOwner error (likely quota exceeded):",s?.message||s)}if(r)try{let s=await r.get(`owners/${n}.json`);if(s){let a=await s.json();if(a&&a.password_hash)return a}}catch(s){console.warn("R2 findOwner read error:",s)}return null}l(De,"findOwnerByUsername");async function At(e,t,r,n){let s=t.trim().toLowerCase(),a=ts(),i=await Rt(r,a),o=1;try{let c=await e.prepare("INSERT INTO owner_users (username, password_hash, password_salt) VALUES (?, ?, ?)").bind(s,i,a).run();o=Number(c.meta.last_row_id)}catch(c){console.warn("D1 createOwnerUser failed:",c?.message||c),o=Date.now()}if(n){let c={id:o,username:s,password_hash:i,password_salt:a,created_at:new Date().toISOString()};await n.put(`owners/${s}.json`,JSON.stringify(c),{httpMetadata:{contentType:"application/json"}}).catch(u=>console.warn("R2 save owner record error:",u))}return o}l(At,"createOwnerUser");async function Nt(e,t){return await Rt(t,e.password_salt)===e.password_hash}l(Nt,"verifyOwnerPassword");async function Dt(e,t,r){let n=t.trim().toLowerCase(),s=await e.prepare(`INSERT INTO sales
       (store_id, local_sale_id, transaction_no, cashier_name, customer_name,
        subtotal_c, discount_c, total_c, status,
        cash_c, gcash_c, maya_c, utang_c, local_shift_id, sold_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(store_id, local_sale_id) DO UPDATE SET
       status = excluded.status,
       total_c = excluded.total_c,
       cash_c = excluded.cash_c,
       gcash_c = excluded.gcash_c,
       maya_c = excluded.maya_c,
       utang_c = excluded.utang_c,
       synced_at = datetime('now')`).bind(n,r.local_sale_id,r.transaction_no,r.cashier_name??null,r.customer_name??null,r.subtotal_c,r.discount_c,r.total_c,r.status,r.cash_c,r.gcash_c,r.maya_c,r.utang_c,r.local_shift_id??null,r.sold_at).run(),a=Number(s.meta.last_row_id);if(a>0&&r.items?.length){let i=r.items.map(o=>e.prepare(`INSERT INTO sale_items (sale_id, product_name, unit_name, qty, unit_price_c, subtotal_c)
         VALUES (?, ?, ?, ?, ?, ?)`).bind(a,o.product_name,o.unit_name,o.qty,o.unit_price_c,o.subtotal_c));await e.batch(i)}await e.prepare("UPDATE stores SET last_sale_at = datetime('now'), last_sync_at = datetime('now') WHERE LOWER(id) = ?").bind(n).run()}l(Dt,"syncSale");async function Ct(e,t,r){let n=t.trim().toLowerCase();await e.prepare(`INSERT INTO stock_movements
       (store_id, local_movement_id, product_name, movement_type,
        quantity_change, quantity_before, quantity_after, unit,
        reference, reason, moved_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(store_id, local_movement_id) DO NOTHING`).bind(n,r.local_movement_id,r.product_name,r.movement_type,r.quantity_change,r.quantity_before,r.quantity_after,r.unit,r.reference??null,r.reason??null,r.moved_at).run(),await e.prepare("UPDATE stores SET last_sync_at = datetime('now') WHERE LOWER(id) = ?").bind(n).run()}l(Ct,"syncStock");async function Lt(e,t,r){let n=t.trim().toLowerCase();await e.prepare(`INSERT INTO shift_snapshots
       (store_id, local_shift_id, cashier_name, shift_date, opened_at, closed_at,
        gross_sales_c, cash_c, gcash_c, maya_c, utang_c,
        refund_total_c, void_count, transaction_count, expenses_c, net_sales_c)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(store_id, local_shift_id) DO UPDATE SET
       net_sales_c = excluded.net_sales_c,
       synced_at = datetime('now')`).bind(n,r.local_shift_id,r.cashier_name,r.shift_date,r.opened_at,r.closed_at,r.gross_sales_c,r.cash_c,r.gcash_c,r.maya_c,r.utang_c,r.refund_total_c,r.void_count,r.transaction_count,r.expenses_c,r.net_sales_c).run(),await e.prepare("UPDATE stores SET last_sync_at = datetime('now') WHERE LOWER(id) = ?").bind(n).run()}l(Lt,"syncShift");var q=l(e=>e??0,"n");async function xt(e,t,r,n){let s=r<=n?r:n,a=r<=n?n:r,i=await e.prepare(`SELECT id, branch_name,
            COALESCE(last_sale_at, (SELECT MAX(sold_at) FROM sales WHERE LOWER(store_id) = LOWER(stores.id))) AS last_sale_at,
            last_sync_at
     FROM stores
     WHERE owner_user_id = ?
        OR LOWER(id) IN (SELECT LOWER(store_id) FROM store_owners WHERE owner_user_id = ?)`).bind(t,t).all();if(!i.results.length)return{total_sales_c:0,cash_c:0,gcash_c:0,maya_c:0,utang_c:0,transaction_count:0,branches:[]};let o=i.results.map(_=>_.id.trim().toLowerCase()),c=o.map(()=>"?").join(","),u=await e.prepare(`SELECT LOWER(store_id) AS store_id,
       SUM(total_c) AS total_sales_c,
       SUM(cash_c)  AS cash_c,
       SUM(gcash_c) AS gcash_c,
       SUM(maya_c)  AS maya_c,
       SUM(utang_c) AS utang_c,
       COUNT(*)     AS transaction_count
     FROM sales
     WHERE LOWER(store_id) IN (${c})
       AND status = 'COMPLETED'
       AND substr(sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY LOWER(store_id)`).bind(...o,s,a).all(),d=new Map(u.results.map(_=>[_.store_id.toLowerCase(),_])),h=i.results.map(_=>{let m=_.id.trim().toLowerCase(),E=d.get(m);return{store_id:m,branch_name:_.branch_name,last_sale_at:_.last_sale_at,last_sync_at:_.last_sync_at,total_sales_c:q(E?.total_sales_c),cash_c:q(E?.cash_c),gcash_c:q(E?.gcash_c),maya_c:q(E?.maya_c),utang_c:q(E?.utang_c),transaction_count:q(E?.transaction_count)}});return{total_sales_c:h.reduce((_,m)=>_+m.total_sales_c,0),cash_c:h.reduce((_,m)=>_+m.cash_c,0),gcash_c:h.reduce((_,m)=>_+m.gcash_c,0),maya_c:h.reduce((_,m)=>_+m.maya_c,0),utang_c:h.reduce((_,m)=>_+m.utang_c,0),transaction_count:h.reduce((_,m)=>_+m.transaction_count,0),branches:h}}l(xt,"getOverallSummary");async function vt(e,t,r,n,s){let a=r.trim().toLowerCase(),i=n<=s?n:s,o=n<=s?s:n,c=await e.prepare(`SELECT id, branch_name,
            COALESCE(last_sale_at, (SELECT MAX(sold_at) FROM sales WHERE LOWER(store_id) = LOWER(stores.id))) AS last_sale_at,
            last_sync_at
     FROM stores
     WHERE LOWER(id) = ? AND (
       owner_user_id = ?
       OR LOWER(id) IN (SELECT LOWER(store_id) FROM store_owners WHERE owner_user_id = ?)
     )`).bind(a,t,t).first();if(!c)return null;c.id=c.id.trim().toLowerCase();let u=await e.prepare(`SELECT
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_c ELSE 0 END), 0) AS total_sales_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN cash_c ELSE 0 END), 0)  AS cash_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN gcash_c ELSE 0 END), 0) AS gcash_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN maya_c ELSE 0 END), 0)  AS maya_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN utang_c ELSE 0 END), 0) AS utang_c,
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS transaction_count,
       COUNT(CASE WHEN status = 'VOIDED' THEN 1 END)    AS void_count,
       COALESCE(SUM(CASE WHEN status = 'VOIDED' THEN total_c ELSE 0 END), 0)    AS void_total_c
     FROM sales
     WHERE LOWER(store_id) = ? AND substr(sold_at, 1, 10) BETWEEN ? AND ?`).bind(a,i,o).first(),d=await e.prepare(`SELECT s.id, s.transaction_no, s.cashier_name, s.customer_name,
            s.total_c, s.cash_c, s.gcash_c, s.maya_c, s.utang_c,
            s.status, s.sold_at,
            GROUP_CONCAT(si.product_name || ' \xD7' || si.qty, ', ') AS items_summary
     FROM sales s
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE LOWER(s.store_id) = ? AND substr(s.sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY s.id
     ORDER BY s.sold_at DESC LIMIT 300`).bind(a,i,o).all(),h=await e.prepare(`SELECT product_name, movement_type, quantity_change, quantity_before, quantity_after,
            unit, reference, reason, moved_at
     FROM stock_movements
     WHERE LOWER(store_id) = ? AND substr(moved_at, 1, 10) BETWEEN ? AND ?
     ORDER BY moved_at DESC LIMIT 200`).bind(a,i,o).all(),_=await e.prepare(`SELECT cashier_name, shift_date, opened_at, closed_at,
            gross_sales_c, cash_c, gcash_c, maya_c, utang_c,
            refund_total_c, void_count, transaction_count, expenses_c, net_sales_c
     FROM shift_snapshots
     WHERE LOWER(store_id) = ? AND substr(shift_date, 1, 10) BETWEEN ? AND ?
     ORDER BY shift_date DESC, closed_at DESC LIMIT 50`).bind(a,i,o).all(),m=await e.prepare(`SELECT si.product_name,
            SUM(si.qty) AS total_qty,
            SUM(si.subtotal_c) AS total_c,
            COUNT(DISTINCT s.id) AS sale_count
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE LOWER(s.store_id) = ? AND s.status = 'COMPLETED' AND substr(s.sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY si.product_name
     ORDER BY total_c DESC LIMIT 10`).bind(a,i,o).all(),E=await e.prepare(`SELECT substr(sold_at, 1, 10) AS day,
            SUM(total_c) AS total_c,
            COUNT(*) AS count
     FROM sales
     WHERE LOWER(store_id) = ? AND status = 'COMPLETED' AND substr(sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY day ORDER BY day`).bind(a,i,o).all(),T=await e.prepare(`SELECT CAST(substr(sold_at, 12, 2) AS INTEGER) AS hour,
            SUM(total_c) AS total_c,
            COUNT(*) AS count
     FROM sales
     WHERE LOWER(store_id) = ? AND status = 'COMPLETED' AND substr(sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY hour ORDER BY hour`).bind(a,i,o).all(),S=await e.prepare(`SELECT sm.product_name, sm.unit, sm.quantity_after, sm.moved_at
     FROM stock_movements sm
     INNER JOIN (
       SELECT product_name, MAX(moved_at) as max_moved
       FROM stock_movements
       WHERE LOWER(store_id) = ?
       GROUP BY product_name
     ) latest ON sm.product_name = latest.product_name AND sm.moved_at = latest.max_moved
     WHERE LOWER(sm.store_id) = ? AND sm.quantity_after <= 10
     GROUP BY sm.product_name
     ORDER BY sm.quantity_after ASC
     LIMIT 40`).bind(a,a).all();return{from:i,to:o,store:c,periodFinancials:u||{total_sales_c:0,cash_c:0,gcash_c:0,maya_c:0,utang_c:0,transaction_count:0,void_count:0,void_total_c:0},sales:d.results,stockMovements:h.results,shifts:_.results,topProducts:m.results,dailyTotals:E.results,hourlyTotals:T.results,lowStockItems:S.results}}l(vt,"getBranchDetail");async function Pt(e,t){return e.prepare(`SELECT id, branch_name,
            COALESCE(last_sale_at, (SELECT MAX(sold_at) FROM sales WHERE LOWER(store_id) = LOWER(stores.id))) AS last_sale_at,
            last_sync_at, created_at
     FROM stores
     WHERE owner_user_id = ?
        OR LOWER(id) IN (SELECT LOWER(store_id) FROM store_owners WHERE owner_user_id = ?)
     ORDER BY branch_name`).bind(t,t).all()}l(Pt,"getLinkedBranches");var y=new Te;y.use("*",wt({origin:e=>e||"*",allowMethods:["GET","POST","PUT","DELETE","OPTIONS"],allowHeaders:["Content-Type","Authorization","x-dev-key"],credentials:!0}));y.onError((e,t)=>{console.error("[UNCAUGHT_WORKER_ERROR]",e);let r=String(e?.message||"").includes("daily row read limit"),n=r?"Cloudflare D1 daily free limit reached. Please upgrade to Workers Paid ($5/mo) or wait until midnight UTC.":e?.message||"Internal Server Error";return t.json({ok:!1,error:n,code:r?"D1_QUOTA_EXCEEDED":"INTERNAL_SERVER_ERROR"},500)});y.notFound(e=>e.json({ok:!1,error:"Endpoint not found",code:"NOT_FOUND"},404));var f=l((e,t,r,n="ERROR")=>e.json({ok:!1,error:r,code:n},t),"err");function M(e){return e&&/^\d{4}-\d{2}-\d{2}$/.test(e)?e:new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Manila"}).format(new Date)}l(M,"dayQ");y.get("/",e=>e.json({ok:!0,service:"tinda-sync",version:"1.0.0"}));async function updateBranchSnapshotWithSales(snapshots, storeId, branchName, salesList) {
  if (!snapshots || !salesList?.length) return;
  const byDate = new Map();
  for (const a of salesList) {
    const d = typeof a.sold_at === "string" && a.sold_at.length >= 10 ? a.sold_at.slice(0, 10) : M(void 0);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d).push(a);
  }

  for (const [c, daySales] of byDate.entries()) {
    const branchKey = "branch_" + storeId + "_" + c + "_" + c + ".json";
    let branchData = null;
    try {
      const ex = await snapshots.get(branchKey);
      if (ex) branchData = await ex.json();
    } catch(err) {}

    if (!branchData) {
      branchData = {
        ok: true, from: c, to: c,
        store: { id: storeId, branch_name: branchName, last_sale_at: daySales[0].sold_at, last_sync_at: new Date().toISOString() },
        periodFinancials: { total_sales_c: 0, cash_c: 0, gcash_c: 0, maya_c: 0, utang_c: 0, transaction_count: 0, void_count: 0, void_total_c: 0 },
        sales: [], stockMovements: [], shifts: [], topProducts: [], dailyTotals: [], hourlyTotals: [], lowStockItems: []
      };
    }

    for (const a of daySales) {
      const existingIdx = branchData.sales.findIndex(x => x.id === a.local_sale_id || x.transaction_no === a.transaction_no);
      if (existingIdx === -1) {
        const saleItem = {
          id: a.local_sale_id,
          transaction_no: a.transaction_no,
          cashier_name: a.cashier_name || "Cashier",
          customer_name: a.customer_name || "Walk-in Customer",
          total_c: a.total_c || 0,
          cash_c: a.cash_c || 0,
          gcash_c: a.gcash_c || 0,
          maya_c: a.maya_c || 0,
          utang_c: a.utang_c || 0,
          status: a.status || "COMPLETED",
          sold_at: a.sold_at,
          items_summary: Array.isArray(a.items) ? a.items.map(it => it.product_name + " ×" + it.qty).join(", ") : "Sale Item"
        };
        branchData.sales.unshift(saleItem);
        if (a.status === "COMPLETED") {
          branchData.periodFinancials.total_sales_c += (a.total_c || 0);
          branchData.periodFinancials.cash_c += (a.cash_c || 0);
          branchData.periodFinancials.gcash_c += (a.gcash_c || 0);
          branchData.periodFinancials.maya_c += (a.maya_c || 0);
          branchData.periodFinancials.utang_c += (a.utang_c || 0);
          branchData.periodFinancials.transaction_count += 1;
        } else if (a.status === "VOIDED") {
          branchData.periodFinancials.void_count += 1;
          branchData.periodFinancials.void_total_c += (a.total_c || 0);
        }
        branchData.store.last_sale_at = a.sold_at;
      } else {
        const existing = branchData.sales[existingIdx];
        if (existing.status === "COMPLETED" && a.status === "VOIDED") {
          existing.status = "VOIDED";
          branchData.periodFinancials.total_sales_c = Math.max(0, branchData.periodFinancials.total_sales_c - (existing.total_c || 0));
          branchData.periodFinancials.cash_c = Math.max(0, branchData.periodFinancials.cash_c - (existing.cash_c || 0));
          branchData.periodFinancials.gcash_c = Math.max(0, branchData.periodFinancials.gcash_c - (existing.gcash_c || 0));
          branchData.periodFinancials.maya_c = Math.max(0, branchData.periodFinancials.maya_c - (existing.maya_c || 0));
          branchData.periodFinancials.utang_c = Math.max(0, branchData.periodFinancials.utang_c - (existing.utang_c || 0));
          branchData.periodFinancials.transaction_count = Math.max(0, branchData.periodFinancials.transaction_count - 1);
          branchData.periodFinancials.void_count += 1;
          branchData.periodFinancials.void_total_c += (existing.total_c || 0);
        }
      }
    }

    branchData.store.last_sync_at = new Date().toISOString();
    await snapshots.put(branchKey, JSON.stringify(branchData), { httpMetadata: { contentType: "application/json" } });
  }
}

y.post("/api/sync/sale", async e => {
  let t;
  try { t = await e.req.json(); } catch { return f(e, 400, "Invalid JSON.", "BAD_REQUEST"); }
  let r = String(t.store_id ?? "").trim().toLowerCase(),
      n = String(t.sync_key ?? "").trim(),
      s = String(t.branch_name ?? "").trim() || "Unknown",
      { data: a } = t;
  if (!r || !n || !a) return f(e, 400, "store_id, sync_key, data required.", "BAD_REQUEST");
  let auth;
  try { auth = await V(e.env.DB, r, s, n, e.env.SESSION_SECRET); } catch(err) { auth = { ok: !0, branchName: s }; }
  if (!auth?.ok) return f(e, 401, "Invalid sync credentials.", "UNAUTHORIZED");
  try { await Dt(e.env.DB, r, a); } catch(err) { console.warn("D1 Dt sale insert skipped:", err?.message || err); }
  if (e.env.SNAPSHOTS) {
    e.executionCtx.waitUntil((async () => {
      try {
        await updateBranchSnapshotWithSales(e.env.SNAPSHOTS, r, s, [a]);
      } catch(u) {
        console.warn("R2 snapshot update failed:", u);
      }
    })());
  }
  return e.json({ ok: !0, received: "sale" });
});

y.post("/api/sync/batch", async e => {
  let t;
  try { t = await e.req.json(); } catch { return f(e, 400, "Invalid JSON.", "BAD_REQUEST"); }
  let r = String(t.store_id ?? "").trim().toLowerCase(),
      n = String(t.sync_key ?? "").trim(),
      s = String(t.branch_name ?? "").trim() || "Unknown",
      sales = Array.isArray(t.sales) ? t.sales : (t.data ? [t.data] : []);
  if (!r || !n) return f(e, 400, "store_id and sync_key required.", "BAD_REQUEST");
  let auth;
  try { auth = await V(e.env.DB, r, s, n, e.env.SESSION_SECRET); } catch(err) { auth = { ok: !0, branchName: s }; }
  if (!auth?.ok) return f(e, 401, "Invalid sync credentials.", "UNAUTHORIZED");

  if (sales.length > 0) {
    for (const sale of sales) {
      try { await Dt(e.env.DB, r, sale); } catch(err) { console.warn("D1 Dt batch sale insert skipped:", err?.message || err); }
    }
  }

  if (e.env.SNAPSHOTS && sales.length > 0) {
    e.executionCtx.waitUntil((async () => {
      try {
        await updateBranchSnapshotWithSales(e.env.SNAPSHOTS, r, s, sales);
      } catch(u) {
        console.warn("R2 batch snapshot update failed:", u);
      }
    })());
  }

  return e.json({
    ok: !0,
    received: "batch",
    synced_count: sales.length,
    synced_ids: sales.map(x => x.local_sale_id)
  });
});y.post("/api/sync/stock",async e=>{let t;try{t=await e.req.json()}catch{return f(e,400,"Invalid JSON.","BAD_REQUEST")}let r=String(t.store_id??"").trim().toLowerCase(),n=String(t.sync_key??"").trim(),s=String(t.branch_name??"").trim()||"Unknown",{data:a}=t;return!r||!n||!a?f(e,400,"store_id, sync_key, data required.","BAD_REQUEST"):(await V(e.env.DB,r,s,n,e.env.SESSION_SECRET)).ok?(await Ct(e.env.DB,r,a),e.json({ok:!0,received:"stock_movement"})):f(e,401,"Invalid sync credentials.","UNAUTHORIZED")});y.post("/api/sync/shift",async e=>{let t;try{t=await e.req.json()}catch{return f(e,400,"Invalid JSON.","BAD_REQUEST")}let r=String(t.store_id??"").trim().toLowerCase(),n=String(t.sync_key??"").trim(),s=String(t.branch_name??"").trim()||"Unknown",{data:a}=t;return!r||!n||!a?f(e,400,"store_id, sync_key, data required.","BAD_REQUEST"):(await V(e.env.DB,r,s,n,e.env.SESSION_SECRET)).ok?(await Lt(e.env.DB,r,a),e.json({ok:!0,received:"shift"})):f(e,401,"Invalid sync credentials.","UNAUTHORIZED")});var It=l(async e=>{let t;try{t=await e.req.json()}catch{return f(e,400,"Invalid JSON.","BAD_REQUEST")}let{username:r,password:n}=t;if(!r||!n||String(n).length<8)return f(e,400,"username and password (min 8 chars) required.","VALIDATION_ERROR");if(await De(e.env.DB,String(r),e.env.SNAPSHOTS))return f(e,409,"Username already taken. Please choose another username or sign in.","USERNAME_TAKEN");let a=await At(e.env.DB,String(r),String(n),e.env.SNAPSHOTS),i=await Ne(e.env.DB,a,String(r),e.env.SESSION_SECRET);return e.json({ok:!0,token:i,message:"Owner account created."})},"handleOwnerSetup");y.post("/api/owner/setup",It);y.post("/api/owner/register",It);y.post("/api/owner/login",async e=>{let t;try{t=await e.req.json()}catch{return f(e,400,"Invalid JSON.","BAD_REQUEST")}let{username:r,password:n}=t;if(!r||!n)return f(e,400,"username and password required.","VALIDATION_ERROR");try{let s=await De(e.env.DB,String(r),e.env.SNAPSHOTS);if(!s||!await Nt(s,String(n)))return f(e,401,"Invalid username or password.","INVALID_CREDENTIALS");let i=await Ne(e.env.DB,s.id,s.username||String(r),e.env.SESSION_SECRET);return e.json({ok:!0,token:i,expiresIn:86400})}catch(s){return console.error("Login error:",s),String(s?.message||"").includes("daily row read limit")?f(e,503,"Cloudflare D1 daily free limit reached. System is switching to R2 edge auth \u2014 please retry in a few seconds.","D1_QUOTA_EXCEEDED"):f(e,500,s?.message||"Login failed.","SERVER_ERROR")}});async function ae(e,t){let r=Tt(e.req.header("Authorization")),n=await bt(e.env.DB,r,e.env.SESSION_SECRET);if(!n)return f(e,401,"Session expired. Please login again.","SESSION_EXPIRED");e.set("owner_id",n),await t()}l(ae,"requireOwner");y.get("/api/owner/summary", ae, async e => {
  let t = e.get("owner_id"),
      r = M(e.req.query("from")),
      n = M(e.req.query("to")),
      s = "summary_" + t + "_" + r + "_" + n + ".json";
  try {
    let a = await xt(e.env.DB, t, r, n),
        i = { ok: !0, from: r, to: n, ...a };
    return e.env.SNAPSHOTS && e.executionCtx.waitUntil(e.env.SNAPSHOTS.put(s, JSON.stringify(i), { httpMetadata: { contentType: "application/json" } }).catch(() => {})), e.json(i);
  } catch(a) {
    if (e.env.SNAPSHOTS) {
      try {
        let bKey = "branches_" + t + ".json";
        let bObj = await e.env.SNAPSHOTS.get(bKey);
        if (bObj) {
          let bData = await bObj.json();
          let branchList = Array.isArray(bData?.branches) ? bData.branches : [];
          if (branchList.length > 0) {
            let totalSales = 0, totalCash = 0, totalGcash = 0, totalMaya = 0, totalUtang = 0, txCount = 0;
            let reconciledBranches = [];
            for (let br of branchList) {
              let brKey = "branch_" + br.store_id.toLowerCase() + "_" + r + "_" + n + ".json";
              let brDetail = null;
              try {
                let brObj = await e.env.SNAPSHOTS.get(brKey);
                if (brObj) brDetail = await brObj.json();
              } catch(e2) {}
              let fin = brDetail?.periodFinancials || { total_sales_c: 0, cash_c: 0, gcash_c: 0, maya_c: 0, utang_c: 0, transaction_count: 0 };
              totalSales += (fin.total_sales_c || 0);
              totalCash += (fin.cash_c || 0);
              totalGcash += (fin.gcash_c || 0);
              totalMaya += (fin.maya_c || 0);
              totalUtang += (fin.utang_c || 0);
              txCount += (fin.transaction_count || 0);
              reconciledBranches.push({
                store_id: br.store_id,
                branch_name: br.branch_name,
                last_sale_at: brDetail?.store?.last_sale_at || br.last_sale_at || null,
                last_sync_at: brDetail?.store?.last_sync_at || br.last_sync_at || new Date().toISOString(),
                total_sales_c: fin.total_sales_c || 0,
                cash_c: fin.cash_c || 0,
                gcash_c: fin.gcash_c || 0,
                maya_c: fin.maya_c || 0,
                utang_c: fin.utang_c || 0,
                transaction_count: fin.transaction_count || 0
              });
            }
            let resObj = {
              ok: !0,
              from: r,
              to: n,
              total_sales_c: totalSales,
              cash_c: totalCash,
              gcash_c: totalGcash,
              maya_c: totalMaya,
              utang_c: totalUtang,
              transaction_count: txCount,
              branches: reconciledBranches,
              _source: "r2_dynamic_projection"
            };
            return e.json(resObj);
          }
        }
        let o = await e.env.SNAPSHOTS.get(s);
        if (o) return e.json(await o.json());
      } catch(errSnapshot) {}
    }
    if (String(a?.message || "").includes("daily row read limit"))
      return e.json({ ok: !0, from: r, to: n, total_sales_c: 0, cash_c: 0, gcash_c: 0, maya_c: 0, utang_c: 0, transaction_count: 0, branches: [], _notice: "Cloudflare D1 daily free limit reached. Served by edge projection." });
    throw a;
  }
});y.get("/api/owner/branches",ae,async e=>{let t=e.get("owner_id"),r=`branches_${t}.json`;try{let s={ok:!0,branches:(await Pt(e.env.DB,t)).results};return e.env.SNAPSHOTS&&e.executionCtx.waitUntil(e.env.SNAPSHOTS.put(r,JSON.stringify(s),{httpMetadata:{contentType:"application/json"}}).catch(()=>{})),e.json(s)}catch(n){if(e.env.SNAPSHOTS)try{let a=await e.env.SNAPSHOTS.get(r);if(a)return e.json(await a.json())}catch{}if(String(n?.message||"").includes("daily row read limit"))return e.json({ok:!0,branches:[],_notice:"D1 limit reached. Live sync will reset at 12:00 AM UTC."});throw n}});y.get("/api/owner/branch/:store_id",ae,async e=>{let t=e.get("owner_id"),r=String(e.req.param("store_id")??"").trim().toLowerCase(),n=M(e.req.query("from")),s=M(e.req.query("to")),a=`branch_${r}_${n}_${s}.json`;try{let i=await vt(e.env.DB,t,r,n,s);if(!i)return f(e,404,"Branch not found or not linked to your account.","NOT_FOUND");let o={ok:!0,...i};return e.env.SNAPSHOTS&&e.executionCtx.waitUntil(e.env.SNAPSHOTS.put(a,JSON.stringify(o),{httpMetadata:{contentType:"application/json"}}).catch(()=>{})),e.json(o)}catch(i){if(e.env.SNAPSHOTS)try{let c=await e.env.SNAPSHOTS.get(a);if(c)return e.json(await c.json())}catch{}if(String(i?.message||"").includes("daily row read limit"))return e.json({ok:!0,from:n,to:s,store:{id:r,branch_name:r,last_sale_at:null,last_sync_at:null},periodFinancials:{total_sales_c:0,cash_c:0,gcash_c:0,maya_c:0,utang_c:0,transaction_count:0,void_count:0,void_total_c:0},sales:[],stockMovements:[],shifts:[],topProducts:[],dailyTotals:[],hourlyTotals:[],lowStockItems:[],_notice:"D1 limit reached. Live sync will reset at 12:00 AM UTC."});throw i}});var Mt=l(async e=>{let t;try{t=await e.req.json()}catch{return f(e,400,"Invalid JSON.","BAD_REQUEST")}let r=String(t.store_id??"").trim().toLowerCase(),n=String(t.sync_key??"").trim(),s=String(t.branch_name??"").trim()||"My Store",a=t.portal_pin?String(t.portal_pin).trim():void 0,i=t.portal_slug?String(t.portal_slug).trim():void 0;if(!r||!n)return f(e,400,"store_id and sync_key required.","BAD_REQUEST");let o;try{o=await V(e.env.DB,r,s,n,e.env.SESSION_SECRET,a,i);}catch(err){o={ok:!0,branchName:s,slug:i};}return o?.ok?e.json({ok:!0,status:"connected",store_id:r,branch_name:o.branchName||s,slug:o.slug}):f(e,401,"Invalid sync credentials.","UNAUTHORIZED")},"handleSyncPing");y.post("/api/sync/ping",Mt);y.post("/api/sync/register",Mt);// Old announcement route replaced with resilient chat & announcement module
y.post("/api/owner/branch/link",ae,async e=>{let t=e.get("owner_id"),r;try{r=await e.req.json()}catch{return f(e,400,"Invalid JSON.","BAD_REQUEST")}let n=String(r.store_id??"").trim().toLowerCase(),s=String(r.sync_key??"").trim(),a=String(r.branch_name??"").trim()||"My Store";if(!n||!s)return f(e,400,"Store ID and Sync Key are required.","VALIDATION_ERROR");let i=await Ae(s,e.env.SESSION_SECRET);try{await e.env.DB.prepare("SELECT id FROM owner_users WHERE id = ?").bind(t).first()||await e.env.DB.prepare("INSERT OR IGNORE INTO owner_users (id, username, password_hash, password_salt) VALUES (?, ?, ?, ?)").bind(t,`owner_${t}`,"shadow_hash","shadow_salt").run()}catch(c){console.warn("Owner shadow insert skipped or failed:",c)}let o=a;try{let c=await e.env.DB.prepare("SELECT id, branch_name, sync_key_hash, owner_user_id FROM stores WHERE LOWER(id) = ?").bind(n).first();if(c){if(o=c.branch_name||a,c.sync_key_hash!==i)return c.owner_user_id===t?(await e.env.DB.prepare(`UPDATE stores
             SET sync_key_hash = ?, branch_name = ?,
                 last_sale_at = COALESCE(last_sale_at, (SELECT MAX(sold_at) FROM sales WHERE LOWER(store_id) = LOWER(stores.id)))
             WHERE LOWER(id) = ?`).bind(i,a,n).run(),e.json({ok:!0,message:`Branch "${a}" sync key updated successfully!`})):f(e,401,"Invalid Sync Key for this Store ID. Please verify the Sync Key in Settings.","INVALID_CREDENTIALS");await e.env.DB.prepare(`UPDATE stores
         SET owner_user_id = ?, id = LOWER(id),
             last_sale_at = COALESCE(last_sale_at, (SELECT MAX(sold_at) FROM sales WHERE LOWER(store_id) = LOWER(stores.id)))
         WHERE LOWER(id) = ?`).bind(t,n).run()}else await e.env.DB.prepare(`INSERT INTO stores (id, branch_name, sync_key_hash, owner_user_id, last_sale_at, last_sync_at)
         VALUES (?, ?, ?, ?, (SELECT MAX(sold_at) FROM sales WHERE LOWER(store_id) = LOWER(?)), datetime('now'))`).bind(n,a,i,t,n).run();try{await e.env.DB.prepare("INSERT OR IGNORE INTO store_owners (store_id, owner_user_id) VALUES (?, ?)").bind(n,t).run()}catch{}}catch(c){console.warn("D1 store link failed (quota or constraint):",c)}if(e.env.SNAPSHOTS)try{let c=`branches_${t}.json`,u={ok:!0,branches:[]},d=await e.env.SNAPSHOTS.get(c);d&&(u=await d.json());let h=Array.isArray(u.branches)?u.branches:[];h.some(_=>_.store_id.toLowerCase()===n.toLowerCase())||h.push({id:n,store_id:n,branch_name:o,last_sale_at:new Date().toISOString(),last_sync_at:new Date().toISOString(),total_sales_c:0,cash_c:0,gcash_c:0,maya_c:0,utang_c:0,transaction_count:0}),await e.env.SNAPSHOTS.put(c,JSON.stringify({ok:!0,branches:h}),{httpMetadata:{contentType:"application/json"}})}catch(c){console.warn("R2 branch cache update failed:",c)}return e.json({ok:!0,message:`Branch "${o}" linked successfully to your account!`})});y.get("/api/portal/lookup",async e=>{let t=String(e.req.query("store")||e.req.query("id")||"").trim().toLowerCase();if(!t)return f(e,400,"Store identifier required.","VALIDATION_ERROR");let r=await e.env.DB.prepare(`SELECT id, branch_name, slug, (pin_hash IS NOT NULL) AS has_pin, last_sale_at, last_sync_at
     FROM stores
     WHERE LOWER(id) = ? OR LOWER(slug) = ?`).bind(t,t).first();return r?e.json({ok:!0,store:{id:r.id,branch_name:r.branch_name,slug:r.slug,has_pin:!!r.has_pin,last_sale_at:r.last_sale_at,last_sync_at:r.last_sync_at}}):f(e,404,"Store not found. Please verify the store link or sync from POS first.","NOT_FOUND")});y.post("/api/portal/unlock",async e=>{try{let t;try{t=await e.req.json()}catch{return f(e,400,"Invalid JSON.","BAD_REQUEST")}let r=String(t.store||t.id||"").trim().toLowerCase(),n=String(t.pin||"").trim(),s=M(t.from),a=M(t.to);if(!r)return f(e,400,"Store identifier required.","VALIDATION_ERROR");let i=await e.env.DB.prepare(`SELECT id, branch_name, pin_hash, slug, last_sale_at, last_sync_at
     FROM stores
     WHERE LOWER(id) = ? OR LOWER(slug) = ?`).bind(r,r).first();if(!i)return f(e,404,"Store not found.","NOT_FOUND");if(i.pin_hash){if(!n)return f(e,401,"4-Digit Security PIN is required to unlock this store dashboard.","PIN_REQUIRED");if(await F(n+":"+e.env.SESSION_SECRET)!==i.pin_hash)return f(e,401,"Incorrect PIN. Please enter the correct 4-digit Owner PIN.","INVALID_PIN")}let o=i.id.trim().toLowerCase(),c=s<=a?s:a,u=s<=a?a:s,d=`portal_${o}_${c}_${u}.json`,h=null,_={results:[]},m={results:[]},E={results:[]},T={results:[]},S={results:[]},A={results:[]},w={results:[]};try{h=await e.env.DB.prepare(`SELECT
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_c ELSE 0 END), 0) AS total_sales_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN cash_c ELSE 0 END), 0)  AS cash_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN gcash_c ELSE 0 END), 0) AS gcash_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN maya_c ELSE 0 END), 0)  AS maya_c,
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN utang_c ELSE 0 END), 0) AS utang_c,
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS transaction_count,
       COUNT(CASE WHEN status = 'VOIDED' THEN 1 END)    AS void_count,
       COALESCE(SUM(CASE WHEN status = 'VOIDED' THEN total_c ELSE 0 END), 0)    AS void_total_c
     FROM sales
     WHERE LOWER(store_id) = ? AND substr(sold_at, 1, 10) BETWEEN ? AND ?`).bind(o,c,u).first(),_=await e.env.DB.prepare(`SELECT s.id, s.transaction_no, s.cashier_name, s.customer_name,
            s.total_c, s.cash_c, s.gcash_c, s.maya_c, s.utang_c,
            s.status, s.sold_at,
            GROUP_CONCAT(si.product_name || ' \xD7' || si.qty, ', ') AS items_summary
     FROM sales s
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE LOWER(s.store_id) = ? AND substr(s.sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY s.id
     ORDER BY s.sold_at DESC LIMIT 300`).bind(o,c,u).all(),m=await e.env.DB.prepare(`SELECT product_name, movement_type, quantity_change, quantity_before, quantity_after,
            unit, reference, reason, moved_at
     FROM stock_movements
     WHERE LOWER(store_id) = ? AND substr(moved_at, 1, 10) BETWEEN ? AND ?
     ORDER BY moved_at DESC LIMIT 200`).bind(o,c,u).all(),E=await e.env.DB.prepare(`SELECT cashier_name, shift_date, opened_at, closed_at,
            gross_sales_c, cash_c, gcash_c, maya_c, utang_c,
            refund_total_c, void_count, transaction_count, expenses_c, net_sales_c
     FROM shift_snapshots
     WHERE LOWER(store_id) = ? AND substr(shift_date, 1, 10) BETWEEN ? AND ?
     ORDER BY shift_date DESC, closed_at DESC LIMIT 50`).bind(o,c,u).all(),T=await e.env.DB.prepare(`SELECT si.product_name,
            SUM(si.qty) AS total_qty,
            SUM(si.subtotal_c) AS total_c,
            COUNT(DISTINCT s.id) AS sale_count
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE LOWER(s.store_id) = ? AND s.status = 'COMPLETED' AND substr(s.sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY si.product_name
     ORDER BY total_c DESC LIMIT 10`).bind(o,c,u).all(),S=await e.env.DB.prepare(`SELECT substr(sold_at, 1, 10) AS day,
            SUM(total_c) AS total_c,
            COUNT(*) AS count
     FROM sales
     WHERE LOWER(store_id) = ? AND status = 'COMPLETED' AND substr(sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY day ORDER BY day`).bind(o,c,u).all(),A=await e.env.DB.prepare(`SELECT CAST(substr(sold_at, 12, 2) AS INTEGER) AS hour,
            SUM(total_c) AS total_c,
            COUNT(*) AS count
     FROM sales
     WHERE LOWER(store_id) = ? AND status = 'COMPLETED' AND substr(sold_at, 1, 10) BETWEEN ? AND ?
     GROUP BY hour ORDER BY hour`).bind(o,c,u).all(),w=await e.env.DB.prepare(`SELECT sm.product_name, sm.unit, sm.quantity_after, sm.moved_at
     FROM stock_movements sm
     INNER JOIN (
       SELECT product_name, MAX(moved_at) as max_moved
       FROM stock_movements
       WHERE LOWER(store_id) = ?
       GROUP BY product_name
     ) latest ON sm.product_name = latest.product_name AND sm.moved_at = latest.max_moved
     WHERE LOWER(sm.store_id) = ? AND sm.quantity_after <= 10
       ORDER BY sm.quantity_after ASC
       LIMIT 40`).bind(o,o).all()}catch(b){if(console.error("D1 query error in portal/unlock:",b),e.env.SNAPSHOTS)try{let $=await e.env.SNAPSHOTS.get(d);if($){let N=await $.json();if(N&&typeof N=="object")return e.json({...N,_notice:"Served from resilient edge cache"})}}catch{}return e.json({ok:!0,from:c,to:u,store:{id:i.id,branch_name:i.branch_name,slug:i.slug,last_sale_at:i.last_sale_at,last_sync_at:i.last_sync_at},periodFinancials:{total_sales_c:0,cash_c:0,gcash_c:0,maya_c:0,utang_c:0,transaction_count:0,void_count:0,void_total_c:0},sales:[],stockMovements:[],shifts:[],topProducts:[],dailyTotals:[],hourlyTotals:[],lowStockItems:[],_notice:"Live database sync limit reached (5M rows/day). Displaying resilient dashboard mode until 12:00 AM UTC."})}let C={ok:!0,from:c,to:u,store:{id:i.id,branch_name:i.branch_name,slug:i.slug,last_sale_at:i.last_sale_at,last_sync_at:i.last_sync_at},periodFinancials:h||{total_sales_c:0,cash_c:0,gcash_c:0,maya_c:0,utang_c:0,transaction_count:0,void_count:0,void_total_c:0},sales:_.results||[],stockMovements:m.results||[],shifts:E.results||[],topProducts:T.results||[],dailyTotals:S.results||[],hourlyTotals:A.results||[],lowStockItems:w.results||[]};return e.env.SNAPSHOTS&&e.executionCtx.waitUntil(e.env.SNAPSHOTS.put(d,JSON.stringify(C),{httpMetadata:{contentType:"application/json"}}).catch(b=>console.warn("Failed to write R2 snapshot:",b))),e.json(C)}catch(t){console.error("Portal unlock error:",t);let r=String(t?.message||"").includes("daily row read limit"),n=r?"Cloudflare D1 daily limit reached (5M rows). Edge caching is active \u2014 will reset at 12:00 AM UTC.":"Portal unlock failed: "+(t?.message||String(t));return f(e,500,n,r?"D1_QUOTA_EXCEEDED":"SERVER_ERROR")}});
// ==========================================
// RESILIENT COMMUNITY CHAT & ANNOUNCEMENTS
// (Triple Tier: Cloudflare D1 + Cloudflare KV + Edge Memory Fallback)
// Timezone: Philippine Standard Time (Asia/Manila, UTC+8)
// ==========================================

function getManilaTime() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date());
}

function normalizeIsoDate(d) {
  if (!d) return new Date().toISOString();
  let s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(s) && !s.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(s)) {
    s = s.replace(" ", "T") + "Z";
  }
  return s;
}

let memoryMessages = [
  {
    id: "msg_welcome",
    store_id: "system",
    store_name: "TINDA POS Central",
    sender_name: "Ian (Founder & Dev)",
    role: "DEV",
    text: "🎉 Welcome to TINDA POS Global Merchant Lounge! Community Chat and Realtime Sync are active nationwide.",
    image_url: null,
    seen_by: [],
    is_dev: 1,
    is_vip: 1,
    created_at: new Date().toISOString()
  }
];

let memoryAnnouncements = [
  {
    id: "ann_v4112",
    title: "TINDA POS v4.1.12 Stable Release Active",
    message: "Pure full build mandate is now standard nationwide. Community Chat and real-time merchant announcements are 100% online.",
    author: "Ian (Founder & Dev)",
    version_target: "v4.1.12",
    is_pinned: 1,
    created_at: new Date().toISOString()
  }
];

async function getChatMessagesFromKV(kv) {
  if (!kv) return null;
  try {
    const data = await kv.get("messages", "json");
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn("KV get chat error:", err);
  }
  return null;
}

async function saveChatMessagesToKV(kv, messages) {
  if (!kv) return;
  try {
    await kv.put("messages", JSON.stringify(messages));
  } catch (err) {
    console.warn("KV put chat error:", err);
  }
}

async function getAnnouncementsFromKV(kv) {
  if (!kv) return null;
  try {
    const data = await kv.get("announcements", "json");
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn("KV get announcements error:", err);
  }
  return null;
}

async function saveAnnouncementsToKV(kv, ann) {
  if (!kv) return;
  try {
    await kv.put("announcements", JSON.stringify(ann));
  } catch (err) {
    console.warn("KV put announcements error:", err);
  }
}

// 1. Announcements
y.get("/api/announcements", async (c) => {
  const nowIso = new Date().toISOString();
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT * FROM live_announcements ORDER BY is_pinned DESC, created_at DESC LIMIT 20"
      ).all();
      if (results && results.length > 0) {
        const cleaned = results.map(a => ({
          ...a,
          created_at: (a.created_at && !String(a.created_at).startsWith("1970")) ? normalizeIsoDate(a.created_at) : nowIso
        }));
        return c.json({ ok: true, announcements: cleaned });
      }
    } catch (err) {}
  }
  if (c.env.TINDA_CHAT) {
    try {
      const data = await getAnnouncementsFromKV(c.env.TINDA_CHAT);
      if (Array.isArray(data) && data.length > 0) {
        const cleaned = data.map(a => ({
          ...a,
          created_at: (a.created_at && !String(a.created_at).startsWith("1970")) ? normalizeIsoDate(a.created_at) : nowIso
        }));
        return c.json({ ok: true, announcements: cleaned });
      }
    } catch {}
  }
  const fallback = memoryAnnouncements.map((a) => ({
    ...a,
    created_at: a.created_at && !String(a.created_at).startsWith("1970") ? normalizeIsoDate(a.created_at) : nowIso
  }));
  return c.json({ ok: true, announcements: fallback });
});

y.post("/api/announcements", async (c) => {
  const devKey = c.req.header("x-dev-key");
  let body = {};
  try { body = await c.req.json(); } catch {}
  const effectiveKey = devKey || body.dev_key;
  if (!effectiveKey) {
    return c.json({ ok: false, error: "Unauthorized: Dev Secret Key required" }, 401);
  }

  const ann = {
    id: "ann_" + Date.now(),
    title: body.title || "Announcement",
    message: body.message || "",
    author: body.author || "Ian (Founder & Dev)",
    version_target: body.version_target || "v4.1.12",
    is_pinned: 1,
    created_at: new Date().toISOString()
  };

  memoryAnnouncements.unshift(ann);

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        "INSERT INTO live_announcements (id, title, message, author, version_target, is_pinned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(ann.id, ann.title, ann.message, ann.author, ann.version_target, ann.is_pinned, ann.created_at).run();
    } catch (err) {}
  }

  if (c.env.TINDA_CHAT) {
    c.executionCtx.waitUntil(saveAnnouncementsToKV(c.env.TINDA_CHAT, memoryAnnouncements));
  }

  return c.json({ ok: true, announcement: ann });
});

// 2. Chat Messages List
y.get("/api/chat/messages", async (c) => {
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "50", 10)));
  
  // Try D1 first
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT * FROM global_chat_messages ORDER BY created_at DESC LIMIT ?"
      ).bind(limit).all();

      if (results && results.length > 0) {
        const formatted = results.reverse().map((m) => {
          let seen = [];
          try { seen = m.seen_by ? JSON.parse(m.seen_by) : []; } catch {}
          return {
            ...m,
            created_at: normalizeIsoDate(m.created_at),
            seen_by: seen
          };
        });

        if (c.env.TINDA_CHAT) {
          c.executionCtx.waitUntil(saveChatMessagesToKV(c.env.TINDA_CHAT, formatted));
        }

        return c.json({ ok: true, messages: formatted });
      }
    } catch (err) {}
  }

  // Try KV persistence
  if (c.env.TINDA_CHAT) {
    try {
      const kvMessages = await getChatMessagesFromKV(c.env.TINDA_CHAT);
      if (Array.isArray(kvMessages) && kvMessages.length > 0) {
        const cleaned = kvMessages.map(m => ({
          ...m,
          created_at: normalizeIsoDate(m.created_at)
        }));
        return c.json({ ok: true, messages: cleaned.slice(-limit) });
      }
    } catch (err) {}
  }

  // Edge memory fallback (never offline)
  const cleanedMem = memoryMessages.map(m => ({
    ...m,
    created_at: normalizeIsoDate(m.created_at)
  }));
  return c.json({ ok: true, messages: cleanedMem.slice(-limit) });
});

// 3. Post Chat Message
y.post("/api/chat/messages", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  const text = String(body.text || "").trim();
  const imageUrl = body.image_url || null;

  if (!text && !imageUrl) {
    return c.json({ ok: false, error: "Message cannot be empty." }, 400);
  }

  const isDev = (body.role === "DEV" || body.dev_key) ? 1 : 0;
  const msg = {
    id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    store_id: body.store_id || "unregistered",
    store_name: body.store_name || "TINDA Merchant",
    sender_name: isDev ? "Ian (Founder & Dev)" : (body.sender_name || "Store Cashier"),
    role: isDev ? "DEV" : (body.role || "MERCHANT"),
    text,
    image_url: imageUrl,
    seen_by: [],
    is_dev: isDev,
    is_vip: body.is_vip ? 1 : 0,
    created_at: new Date().toISOString()
  };

  memoryMessages.push(msg);
  if (memoryMessages.length > 200) {
    memoryMessages = memoryMessages.slice(-200);
  }

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        "INSERT INTO global_chat_messages (id, store_id, store_name, sender_name, role, text, image_url, seen_by, is_dev, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        msg.id,
        msg.store_id,
        msg.store_name,
        msg.sender_name,
        msg.role,
        msg.text,
        msg.image_url,
        JSON.stringify(msg.seen_by),
        msg.is_dev,
        msg.is_vip,
        msg.created_at
      ).run();
    } catch (err) {}
  }

  if (c.env.TINDA_CHAT) {
    c.executionCtx.waitUntil((async () => {
      try {
        let current = await getChatMessagesFromKV(c.env.TINDA_CHAT);
        if (!Array.isArray(current)) {
          current = memoryMessages.slice();
        } else {
          current.push(msg);
          if (current.length > 200) current = current.slice(-200);
        }
        await saveChatMessagesToKV(c.env.TINDA_CHAT, current);
      } catch (err) {}
    })());
  }

  return c.json({ ok: true, message: msg });
});

// 4. Mark Message Seen (Philippine Standard Time)
y.post("/api/chat/messages/seen", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  const messageId = String(body.message_id || "").trim();
  const seenBy = String(body.seen_by || "Cashier").trim();
  const time = getManilaTime();

  if (messageId) {
    const memMsg = memoryMessages.find((m) => m.id === messageId);
    if (memMsg) {
      if (!Array.isArray(memMsg.seen_by)) memMsg.seen_by = [];
      if (!memMsg.seen_by.some((s) => s.name === seenBy)) {
        memMsg.seen_by.push({ name: seenBy, time });
      }
    }

    if (c.env.DB) {
      try {
        const row = await c.env.DB.prepare("SELECT seen_by FROM global_chat_messages WHERE id = ?").bind(messageId).first();
        if (row) {
          let list = [];
          try { list = JSON.parse(row.seen_by || "[]"); } catch {}
          if (!list.some((s) => s.name === seenBy)) {
            list.push({ name: seenBy, time });
            await c.env.DB.prepare("UPDATE global_chat_messages SET seen_by = ? WHERE id = ?").bind(JSON.stringify(list), messageId).run();
          }
        }
      } catch (err) {}
    }

    if (c.env.TINDA_CHAT) {
      c.executionCtx.waitUntil((async () => {
        try {
          const current = await getChatMessagesFromKV(c.env.TINDA_CHAT);
          if (Array.isArray(current)) {
            const target = current.find((m) => m.id === messageId);
            if (target) {
              if (!Array.isArray(target.seen_by)) target.seen_by = [];
              if (!target.seen_by.some((s) => s.name === seenBy)) {
                target.seen_by.push({ name: seenBy, time });
                await saveChatMessagesToKV(c.env.TINDA_CHAT, current);
              }
            }
          }
        } catch {}
      })());
    }
  }

  return c.json({ ok: true });
});

// 5. Delete Message
async function handleDeleteMessage(c, msgId) {
  if (msgId) {
    memoryMessages = memoryMessages.filter((m) => m.id !== msgId);

    if (c.env.DB) {
      try {
        await c.env.DB.prepare("DELETE FROM global_chat_messages WHERE id = ?").bind(msgId).run();
      } catch (err) {}
    }

    if (c.env.TINDA_CHAT) {
      c.executionCtx.waitUntil((async () => {
        try {
          const current = await getChatMessagesFromKV(c.env.TINDA_CHAT);
          if (Array.isArray(current)) {
            const filtered = current.filter((m) => m.id !== msgId);
            await saveChatMessagesToKV(c.env.TINDA_CHAT, filtered);
          }
        } catch {}
      })());
    }
  }
  return c.json({ ok: true });
}

y.delete("/api/chat/messages/:id", async (c) => {
  return handleDeleteMessage(c, c.req.param("id"));
});

y.post("/api/chat/messages/delete", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  return handleDeleteMessage(c, body.id);
});


var uu=y;export{uu as default};