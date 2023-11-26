const LS = browser.storage.local;
function save(configname) {
  browser.tabs.executeScript({
    code:
      `Array.from(document.querySelectorAll(".room_config_item")).map(node => ({
        value: node.hasAttribute('data-song') ? node.getAttribute('data-song') : (node.type === 'checkbox' ? node.checked : (node.type === 'input' ? node.value : node.innerHTML)),
        key: node.getAttribute('data-index')
      }))`
  }).then(saved => {
    var config = {};
    saved[0].forEach((item) => {
      config[item.key] = item.value;
    });
    LS.set({[configname]: JSON.stringify(config)});
    getAllNames();
  })
}

function load(configname){
  LS.get(configname).then(response => {
    toLoad = JSON.parse(response[configname]);
    Object.keys(toLoad).forEach(key => {
      console.log(key + " - " + toLoad[key]);
      browser.tabs.executeScript({
        code:
          `if(document.querySelector(".room_config_item[data-index='${key}']").type === 'checkbox'){
              document.querySelector(".room_config_item[data-index='${key}']").checked = ${toLoad[key]};
            }else if(document.querySelector(".room_config_item[data-index='${key}']").hasAttribute('data-song')){
              document.querySelector(".room_config_item[data-index='${key}']").setAttribute('data-song','${toLoad[key]}');
            }
            else if(document.querySelector(".room_config_item[data-index='${key}']").type === 'input'){
              document.querySelector(".room_config_item[data-index='${key}']").value = '${toLoad[key]}';
            }else{
              document.querySelector(".room_config_item[data-index='${key}']").innerHTML = '${toLoad[key]}';
            
            };`
      });
    });
    browser.tabs.executeScript({
      code:
        `document.querySelectorAll(".room_config_row").forEach(node => {
          node.classList.add('unsaved');
        });
        document.querySelector("#room_opts_save").classList.add('unsaved');`
    });
    document.body.innerHTML = "<h1>Loaded! Don't forget to save.</h1>";
  });
}
function delcfg(configname){
  console.log(configname);
  LS.remove(configname).then(() => {
    getAllNames();
  });
}
function getAllNames(){
  LS.get().then(ls => {
    document.querySelector("#savedconfigstable").innerHTML = "";
        if (Object.keys(ls).length > 0) {
          console.log("test2");
          const table = document.querySelector("#savedconfigstable");
          Object.keys(ls).forEach(name => {
            const row = document.createElement('tr');
            const button = document.createElement('button');
            button.id = name;
            button.textContent = name;
            button.addEventListener("click", function(){
              clickhandler(name);
            });
            row.appendChild(button);
            table.appendChild(row);
          });
        }else{
          document.querySelector("#savedconfigstable").innerHTML = "<tr>Nothing yet.</tr>";
    }
    return Object.keys(ls);


  });
  
}
function clickhandler(configname){
  document.querySelector("#savedconfigstable").innerHTML = "<tr><button id='load'>☑️ Load</button> <button id='delete'>🗑️ Delete</button></tr><tr><button id='back'>↩️ Back</button>";
  console.log("test");
  document.querySelector("#load").addEventListener("click", function(){
    browser.tabs.executeScript({
      code:
        `document.querySelector("#room_opts_save").offsetParent!=null;`
    }).then(response => {
      console.log(response);
    if (!response[0]){
      document.body.innerHTML = "<h1>❌ Cannot find the config menu on the page!<br>Enter a room first!</h1>";
    } else {
      document.body.innerHTML = "<h1>Loading preset!<br>If you see this for a long time, the add-on may have crashed.</h1>";
      load(configname);
    }
  })

  });
  document.querySelector("#delete").addEventListener("click", function(){
    delcfg(configname);
  });
  document.querySelector("#back").addEventListener("click", function(){
    getAllNames();
  });
}
//----------------------------------------------
//Load all names on the main screen
LS.get().then(response => {
  console.log(response);
  
});

document.querySelector("#save").addEventListener("click", function(){
  var name = document.querySelector("#configname").value;
  if (name == "") {
    name = "My preset";
  }
  browser.tabs.executeScript({
    code:
      `document.querySelector("#room_opts_save").offsetParent!=null;`
  }).then(response => {
    if (!response[0]) {
    document.body.innerHTML = "<h1>❌ Cannot find the config menu on the page!<br>Enter a room first!</h1>";
  } else {
    save(name);
  }
})
});

getAllNames();