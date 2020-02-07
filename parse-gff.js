const gff = require('@gmod/gff').default
const fs = require('fs')

function process(r0) {
  var rrs = [];
  if (Array.isArray(r0)) {
    var rrs = r0;
  }
  else {
    rrs = [r0];
  }
  var myID = {};
  for (var r = 0; r < rrs.length; r++) {
    var cfids = {};
    var rr = rrs[r];

    if (rr.hasOwnProperty('attributes') && rr.attributes.hasOwnProperty('ID')) {
      if (Array.isArray(rr.attributes.ID)) {
        if (rr.attributes.ID.length > 1) {
          console.log("#ERROR TOO MANY IDS ");
          console.log("#ERROR "+rr.attributes.ID);
          return;
        }
        for (var p = 0; p< rr.attributes.ID.length; p++) {
          myID[rr.attributes.ID[p]] = 1;
        }
      }
      else {
        myID[rr.attributes.ID] = 1;
      }
    }
    if ( rr.hasOwnProperty('child_features') && Array.isArray(rr['child_features']) ) {
      var cfs = rr['child_features'];
      for (var c = 0; c < cfs.length; c++) {
        var cf = cfs[c];
        if (Array.isArray(cf) && cf.length == 1) {
          cf = cf[0];
        }
        if (cf.hasOwnProperty('child_features')) {
          ff = [];
          //array of length 1
          if (Array.isArray(cf.attributes.ID) && cf.attributes.ID.length == 1) {
            ff.push(cf.attributes.ID[0]);
          }
          //array of length 0
          else if (Array.isArray(cf.attributes.ID) && cf.attributes.ID.length == 0) {
            console.log("#ERROR 00 ARRAY");
            console.log("#ERROR "+cf.attributes.ID);
          }
          //array of length > 1
          else if (Array.isArray(cf.attributes.ID) > 1) {
            console.log("#ERROR ++ ARRAY");
            console.log("#ERROR "+cf.attributes.ID);
          }
          //not an array
          else {
            ff.push(cf.attributes.ID);
          }
          for (var f = 0; f < ff.length; f++) {
            cfids[ff[f]] = 1;
          }
        }
        else {
          //console.log("#ERROR NO CHILDREN");
        }
        var cc = process(cf);
        for (var j = 0; j < cc.length; j++) {
          cfids[cc[j]] = 1;
        }
      }
    }

    var reserved_attributes = {};
    var vendor_attributes = [];

    if ( rr.hasOwnProperty('attributes') ) {
      var attr = rr['attributes'];
      for (var a in attr) {
        if (/^[A-Z]/.test( a )) {
          var nm = {};
          nm[a] = attr[a];
          reserved_attributes[a] = attr[a];
        }
        else {
          var nm = {};
          nm['key'] = a;
          nm['value'] = attr[a];
          vendor_attributes.push(nm);
        }
      }
    }

    delete rr['attributes'];
    //TODO somehow, some of the vendor attributes are over-nested
    if (Array.isArray(vendor_attributes) && vendor_attributes.length == 1 && vendor_attributes[0].key == 'vendor'){
      var v2 = vendor_attributes[0]['value'];
      vendor_attributes = v2;
    }
    reserved_attributes['vendor'] = vendor_attributes;
    rr['attributes'] = reserved_attributes;
    rr['start'] = rr.start/10**7;
    rr['end'] = rr.end/10**7;
    if (rr.start == rr.end) {
      rr['geometry'] = "POINT("+rr.start+" 0)";
    }
    else {
      rr['geometry'] = "LINESTRING("+rr.start+" 0, "+rr.end+" 0)";
    }
    rr.id = Object.keys(myID)[0];
    rr.child_features = Object.keys(cfids);
    console.log(JSON.stringify(rr));
  }
  return(Object.keys(myID));
}

fs.createReadStream('input.gff')
.pipe(gff.parseStream())
.on('data', data => {
    data.forEach(r => {
      process(r);
    });
});

