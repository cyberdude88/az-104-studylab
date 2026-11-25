/* Practice Test core: objectives (AZ-104 skills outline), exam weights, NOV25 priors,
   name pools for rewording, and the Q() registrar the bank files call. */
(function(){
  const domains={
    identity:{name:'Identity & governance',w:.225},
    storage:{name:'Storage',w:.175},
    compute:{name:'Compute',w:.225},
    networking:{name:'Networking',w:.175},
    monitor:{name:'Monitor & maintain',w:.125}
  };
  /* prior = NOV25 objective % (small samples, shrunk toward the domain % at load) */
  const objectives={
    'entra':       {d:'identity',  name:'Manage Microsoft Entra users and groups',prior:50},
    'access':      {d:'identity',  name:'Manage access to Azure resources',prior:100},
    'governance':  {d:'identity',  name:'Manage Azure subscriptions and governance',prior:43},
    'st-access':   {d:'storage',   name:'Configure access to storage',prior:100},
    'st-accounts': {d:'storage',   name:'Configure and manage storage accounts',prior:50},
    'files-blob':  {d:'storage',   name:'Configure Azure Files and Azure Blob Storage',prior:17},
    'iac':         {d:'compute',   name:'Automate deployment with ARM templates or Bicep',prior:40},
    'vms':         {d:'compute',   name:'Create and configure virtual machines',prior:33},
    'containers':  {d:'compute',   name:'Provision and manage containers',prior:null},
    'appsvc':      {d:'compute',   name:'Create and configure Azure App Service',prior:33},
    'vnets':       {d:'networking',name:'Configure and manage virtual networks',prior:0},
    'secure-net':  {d:'networking',name:'Configure secure access to virtual networks',prior:75},
    'dns-lb':      {d:'networking',name:'Configure name resolution and load balancing',prior:25},
    'monitor':     {d:'monitor',   name:'Monitor resources in Azure',prior:67},
    'backup':      {d:'monitor',   name:'Implement backup and recovery',prior:43}
  };
  const domainPrior={identity:55,storage:36,compute:36,networking:36,monitor:50};
  /* rewording pools: every fictional org has a matching .example DNS name */
  const pools={
    org:[['Kestrel Robotics','kestrelrobotics.example'],['Bluefen Studios','bluefen.example'],['Vantage Rail','vantagerail.example'],['Saltmarsh Labs','saltmarshlabs.example'],['Harborline Clinics','harborline.example'],['Quarry Outdoor','quarryoutdoor.example'],['Ledgerworks','ledgerworks.example'],['Orchard & Pike Law','orchardpike.example'],['Lumen Bakery Co','lumenbakery.example'],['Granite Peak School District','granitepeak.example'],['Northdune Freight','northdune.example'],['Copperleaf Insurance','copperleaf.example']],
    person:['Priya Natarajan','Tomas Reyes','Aiko Mori','Daniel Okafor','Lena Fischer','Marcus Bell','Sofia Ruiz','Ivan Petrov','Grace Liu','Noah Haddad'],
    region:[['East US','West US'],['West Europe','North Europe'],['Canada Central','Canada East'],['Australia East','Australia Southeast'],['UK South','UK West'],['Japan East','Japan West']]
  };
  const items=[];
  function Q(it){items.push(it)}
  window.PT={domains,objectives,domainPrior,pools,items,Q};
})();
