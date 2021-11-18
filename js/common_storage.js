export var SyncStorage = 
{
    save: function(sKey, oValue) {
            return new Promise((resolve, reject)=>{
                // Check that there's some code there.
                if (!oValue) {
                    reject('Error: No value specified');
                    //return;
                }

                var o = new Object();
                o[sKey] = oValue;

                // Save it using the Chrome extension storage API.
                chrome.storage.local.set(o, function () {
                    // Notify that we saved.
                    console.log("We have saved all the settings!!! WohOOO");
                    resolve('Settings saved');
                });
        });
    },//save function

    get: function(sKey)
    {
        return new Promise((resolve, reject)=>
        {
            chrome.storage.local.get(sKey, function(result)
            {
                resolve(result[sKey]);
            });

        });
    },

    removeAll: function()
    {
        chrome.storage.local.clear();
    },

    remove: function(sKey)
    {
      return new Promise((resolve, reject)=>
      {
        chrome.storage.local.remove(sKey,()=>{

          // if(typeof chrome.runtime.lastError == 'undefined')
          //   reject();
          // else
            resolve();
        } );
      });
    },

    getAll: function()
    {
        return new Promise((resolve, reject)=>
        {
            chrome.storage.local.get(null, function(result)
            {
                //the original object is keyed in the result by the key used in save
                //console.log(result);
                //resolve(('Value currently is ' + result.key));
                resolve(result);
            });

            // chrome.storage.local.get(['key'], function(result) {
            //     console.log('Value currently is ' + result.key);
            //   });
        });
    },

    getSize: function()
    {
        return new Promise((resolve, reject)=>
        {
            chrome.storage.local.getBytesInUse(null, (result)=>
            {
                //result is integer in bytes
                resolve(result);
            });
        });
    },

    subscribeToChanges: function () 
    {
            return new Promise((resolve, reject)=>
            {
                chrome.storage.onChanged.addListener((changes, namespace)=>
                {
                    resolve(changes);
                });
            });

    }
}