import {CommandPermissionLevel, system , world, CustomCommandParamType} from"@minecraft/server";
import * as ui from "@minecraft/server-ui";


const data_manager = {
    set: (key, data) => {
    if (!key || !data) return [];
    return world.setDynamicProperty(key,JSON.stringify(data));
  },
  get: (key) => {
    if (!key) return [];
    const raw = world.getDynamicProperty(key);
    
    try {
      return JSON.parse(raw);
    } catch {
      return [];  
    }
  },
  del: (key) =>{
    if (!key) return [];
    world.setDynamicProperty(key)
  }
};

function nameSet(player,name=[],nickonly=false) {

  let displayName = player.name

  if (!player) return
  if (nickonly) {
    displayName =`${name[0] ?? ""}${name[1] ?? ""}`
  } else {
    displayName =`${name[0] ?? ""}${displayName}${name[1] ?? ""}`
  }

  player.nameTag = displayName;
}

function reload(player,typeid,nick) 
{
switch (typeid) {
  case 0:
    nameSet(player,[`${nick}`],true)
    break;
  case 1:
    nameSet(player,["",` ${nick}`],false)
    break;
  case 2:
    nameSet(player,[`${nick} `],false)
    break;
  case 3:
    nameSet(player,["",`\n${nick}`],false)
    break;
  case 4:
    nameSet(player,[`${nick}\n`],false)
    break;
  case 5:
    nameSet(player,[],false)
    break;
}
}


function nameset_menu(player){
    const form = new ui.ModalFormData();
    form.title("ニックネームの設定")
    form.textField("ニックネームを入力してください","ニックネーム");
    form.dropdown("種類",[
      "ニックネームのみ ( ニックネーム )",
      "名前の後に ( 名前 ニックネーム )",
      "名前の前に ( ニックネーム 名前 )",
      "名前の下に ( 名前 \n ニックネーム )",
      "名前の上に ( ニックネーム \n 名前 )"

    ])
    form.toggle("データを削除")
    form.show(player).then(response => {
        if (response.canceled){
            return;
        }
        //player.sendMessage("nick:" + String(response.formValues[0]));
        //player.sendMessage("typeid" + String(response.formValues[1]));
        //player.sendMessage("DelData:" + String(response.formValues[2]));
        
        const nick =  String(response.formValues[0])
        let typeid = Number(response.formValues[1])
        const Deldata = response.formValues[2]
        if (!Deldata) if (!nick) {
          player.sendMessage("ニックネームは必須です")
        }
        if (Deldata) typeid = 5
        reload(player,typeid,nick)
        const now = data_manager.get("nick")
        let tempjson = {"name":player.name,"typeid":typeid,"nick":nick}

        let Foundflag = false
        let playerindex = NaN
        now.forEach((value,index) => {
          if (value.name == player.name) {
              playerindex = index
              Foundflag = true
          }
        })
        if (Foundflag) {
          now[playerindex] = tempjson
        } else {
          now.push(tempjson)
        }
        data_manager.set("nick",now)



    })
    .catch(error => {
        player.sendMessage("エラー: " + error.message);
    });
}

world.afterEvents.playerSpawn.subscribe(ev => {
  const player = ev.player
  if (ev.initialSpawn) {
  const now = data_manager.get("nick")
  let Foundflag = false
  let playerindex = NaN
  now.forEach((value,index) => {
    if (value.name == player.name) {
      playerindex = index
      Foundflag = true
    }
  })
    if (Foundflag) {
      reload(player,now[playerindex].typeid,now[playerindex].nick)
    }
  }
})


world.afterEvents.itemUse.subscribe(ev => {
    if (ev.itemStack.typeId == "auieo:nick"){
        if (ev.source.isSneaking && ev.source.hasTag("checklog")) {
          ev.source.sendMessage(JSON.stringify(data_manager.get("nick")))
        } else {
          nameset_menu(ev.source)
        }
    }
})  

system.beforeEvents.startup.subscribe(ev => {
    ev.customCommandRegistry.registerCommand({
        name:"auieo:nick",
        description:"ニックネームを付けます",
        permissionLevel : CommandPermissionLevel.GameDirectors,
        mandatoryParameters:[
          {"name":"typeid","type":CustomCommandParamType.Integer},
          {"name":"nick","type":CustomCommandParamType.String}
        ],
        optionalParameters:[
        ]
    },(origin, ...arg) => {
        if (!arg[0] >=6) {
          origin.sourceEntity.sendMessage( "0~5の間でtypeidを設定してください\n0:ニックネームのみ ( ニックネーム )\n1:名前の後に ( 名前 ニックネーム )\n2:名前の前に ( ニックネーム 名前 )\n3:名前の下に ( 名前 \n ニックネーム )\n4:名前の上に ( ニックネーム \n 名前 )\n5:削除")
          return
        }
        const player = origin.sourceEntity
        if (!player) return

        system.runTimeout(()=>{
          reload(player,Number(arg[0]),String(arg[1]))
        },0)
        
        const now = data_manager.get("nick")
        let tempjson = {"name":player.name,"typeid":arg[0],"nick":arg[1]}
        let Foundflag = false
        let playerindex = NaN
        now.forEach((value,index) => {
          if (value.name == player.name) {
              playerindex = index
              Foundflag = true
          }
        })
        if (Foundflag) {
          now[playerindex] = tempjson
        } else {
          now.push(tempjson)
        }
        if (origin.sourceEntity.typeId == "minecraft:player") data_manager.set("nick",now)
        
        if (origin.sourceEntity.typeId == "minecraft:player") origin.sourceEntity.sendMessage("設定しました");
    })
})