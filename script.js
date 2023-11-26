const LS = browser.storage.local;
function save(configname) {
  LS.get(configname).then(response => {
    if (Object.keys(response).length > 0 && document.querySelector("#save").innerText!="⚠️ Overwrite?") {
      return document.querySelector("#save").innerText = "⚠️ Overwrite?";
    }
    document.querySelector("#save").innerText = "Saving...";
    browser.tabs.executeScript({
      code:
        `Array.from(document.querySelectorAll(".room_config_item")).map(node => ({
          value: node.hasAttribute('data-song') ? node.getAttribute('data-song') : (node instanceof HTMLInputElement && node.type === 'checkbox' ? node.checked : (node instanceof HTMLInputElement ? node.value : node.innerHTML)),
          key: node.getAttribute('data-index')
        }))`
    }).then(saved => {
      var config = {};
      saved[0].forEach((item) => {
        config[item.key] = item.value;
      });
      LS.set({[configname]: JSON.stringify(config)});
      document.querySelector("#save").innerText = "✅ Saved!";
      getAllNames();
    })

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
            else if(document.querySelector(".room_config_item[data-index='${key}']").tagName.toLowerCase() === 'input'){
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
  document.querySelector("#savedconfigstable").innerHTML = "<tr><button id='load'>☑️ Load</button> <button id='setcmd'>📜 Get corresponding /set command</button> <button id='delete'>🗑️ Delete</button></tr><tr><button id='back'>↩️ Back</button>";
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
  document.querySelector("#setcmd").addEventListener("click", function(){
    LS.get(configname).then(response => {
      toLoad = JSON.parse(response[configname]);
      var cmdarray = [];
      var cmd = "/set ";
      Object.keys(toLoad).forEach(key => {
        console.log(key + " - " + toLoad[key]);
        if(toLoad[key] !== "" && key!="options.presets"){
          var val
          switch (toLoad[key]) {
            case "true":
              val=1;
              break;
            case "false":
              val=0
              break;
            default:
              val=toLoad[key];
              break;
          }
          if ((cmd + key + "=" + val + "; ").length > 512) {
            cmdarray.push(cmd);
            cmd = "/set " + key + "=" + val + "; ";
          }else{
            cmd += key + "=" + val + "; ";
          }
        }
      });
      document.body.innerHTML = "<h1>Here are your commands :<br>It's split between multiple commands due to chat length limit<br><table id='commands'></table>Copy them and paste them in the chat!</h1>";
      cmdarray.push(cmd);
      cmdarray.forEach(cmd => {
        const row = document.createElement('tr');
        const textarea = document.createElement('textarea');
        textarea.cols = 50;
        textarea.rows = 3;
        textarea.value = cmd;
        textarea.readOnly = true;
        row.appendChild(textarea);
        document.querySelector("#commands").appendChild(row);
      });
    });
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