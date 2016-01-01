function Jockey3ME() {}

// Variables
Jockey3ME.LedMeterTest = 0;
Jockey3ME.LedMeterTestValue = 1;
Jockey3ME.LedMeterShowValue = 1;
Jockey3ME.LedMeterShowValueTwo = false;
Jockey3ME.VuMeter = 0;
Jockey3ME.scratching = [];
Jockey3ME.Timer_1 = 0;
Jockey3ME.crossfaderScratch = false;

Jockey3ME.LedMeterTestShow = function () {
  midi.sendShortMsg(0x90,0x20,Jockey3ME.LedMeterTestValue);
  midi.sendShortMsg(0x90,0x1F,Jockey3ME.LedMeterTestValue);
  midi.sendShortMsg(0x90,0x1E,Jockey3ME.LedMeterTestValue);
  Jockey3ME.LedMeterTestValue += 2;
  if (Jockey3ME.LedMeterTestValue > 64) {
    engine.stopTimer(Jockey3ME.LedMeterTest);
    Jockey3ME.LedMeterTest = 0;
    midi.sendShortMsg(0x90,0x20,0x40);
    midi.sendShortMsg(0x90,0x1F,0x40);
    midi.sendShortMsg(0x90,0x1E,0x40);

  // Sets Effect Leds
    var getLedValue = 0;
    getLedValue = engine.getValue("[Flanger]","lfoPeriod");
    getLedValue = getLedValue / 15748.0315; // Set Value 0-127
    getLedValue = parseInt(getLedValue);
    midi.sendShortMsg(0x90,0x1E,getLedValue);

    getLedValue = engine.getValue("[Flanger]","lfoDepth");
    getLedValue = getLedValue * 127; // Set Value 0-127
    getLedValue = parseInt(getLedValue);
    midi.sendShortMsg(0x90,0x1F,getLedValue);

    getLedValue = engine.getValue("[Flanger]","lfoDelay");
    getLedValue = getLedValue / 78.74; // Set Value 0-127
    getLedValue = parseInt(getLedValue);
    midi.sendShortMsg(0x90,0x20,getLedValue);
  };
}

Jockey3ME.LedMeterShow = function() {
  midi.sendShortMsg(0x90,0x21,Jockey3ME.LedMeterShowValue);
  midi.sendShortMsg(0x91,0x21,Jockey3ME.LedMeterShowValue);
  if (Jockey3ME.LedMeterShowValueTwo == false) {
    ++Jockey3ME.LedMeterShowValue;
  } else {
    --Jockey3ME.LedMeterShowValue;
  }
  if (Jockey3ME.LedMeterShowValue > 10) Jockey3ME.LedMeterShowValueTwo = true;
  if (Jockey3ME.LedMeterShowValueTwo && Jockey3ME.LedMeterShowValue <= 0) {
    engine.stopTimer(Jockey3ME.LedMeterShowTimer);
    Jockey3ME.LedMeterShowTimer = 0;
    Jockey3ME.VuMeter = engine.beginTimer(20,"Jockey3ME.fVuMeter()");
    // Jockey3ME.LedMeterTest = engine.beginTimer(20,"Jockey3ME.LedMeterTestShow()");
  };
}

Jockey3ME.LedShowBegin = function () {
  Jockey3ME.LedMeterShowTimer = engine.beginTimer(40,"Jockey3ME.LedMeterShow()");
}

Jockey3ME.init = function () {
  for (var i = 1; i < 120; i++) {
    midi.sendShortMsg(0x90,i,0x7F);
    midi.sendShortMsg(0x91,i,0x7F);
  };
  for (var j = 1; j < 120; j++) {
    midi.sendShortMsg(0x90,j,0x00);
    midi.sendShortMsg(0x91,j,0x00);
  };
  Jockey3ME.LedShowBeginTimer = engine.beginTimer(500,"Jockey3ME.LedShowBegin()",1);
}

Jockey3ME.fVuMeter = function () {
  var VuVal1 = engine.getValue("[Channel1]","VuMeter");
  var VuVal2 = engine.getValue("[Channel2]","VuMeter");
  VuVal1 = VuVal1 * 10;
  VuVal1 = parseInt(VuVal1);
  VuVal2 = VuVal2 * 10;
  VuVal2 = parseInt(VuVal2);
  midi.sendShortMsg(0x90,0x21,VuVal1);
  midi.sendShortMsg(0x91,0x21,VuVal2);
}

Jockey3ME.shutdown = function () {
  for (var i = 1; i <= 160; i++) {
    midi.sendShortMsg(0x90,i,0x00);
    midi.sendShortMsg(0x91,i,0x00);
  };
  engine.stopTimer(Jockey3ME.VuMeter);
  Jockey3ME.VuMeter = 0;
}

// The button that enables/disables scratching
Jockey3ME.wheelTouch = function (channel, control, value, status) {
   if (status == 0x90) {
      var currentDeck = 1;
   }
   if (status == 0x91) {
      var currentDeck = 2;
   }
    if (value == 0x7F) {  // Some wheels send 0x90 on press and release, so you need to check the value
        var alpha = 1.0/8;
        var beta = alpha/32;
        engine.scratchEnable(currentDeck, 2048, 45+1/3, alpha, beta);
    }
    else {    // If button up
        engine.scratchDisable(currentDeck);
    }
}
 
// The wheel that actually controls the scratching
Jockey3ME.wheelTurn = function (channel, control, value, status, group) {
    var newValue=(value-64);
   if (status == 0xB0) {
      var currentDeck = 1;
   }
   if (status == 0xB1) {
      var currentDeck = 2;
   }
    // See if we're scratching. If not, skip this.
    if (!engine.isScratching(currentDeck)) {
      engine.setValue(group, "jog", newValue);
      return;
   }
    engine.scratchTick(currentDeck,newValue);
}

Jockey3ME.hotcue_activate = function (channel, control, value, status, group) {
  /*if (control == 0x0B) {
    Jockey3ME.hotc = 1;
  } else if (control == 0x0C) {
    Jockey3ME.hotc = 2;
  } else if (control == 0x0D) {
    Jockey3ME.hotc = 3;
  } else if (control == 0x0E) {
    Jockey3ME.hotc = 4;
  } else if (control == 0x0F) {
    Jockey3ME.hotc = 5;
  } else if (control == 0x10) {
    Jockey3ME.hotc = 6;
  } else if (control == 0x11) {
    Jockey3ME.hotc = 7;
  } else if (control == 0x12) {
    Jockey3ME.hotc = 8;
  }*/
  switch (control) {
    case 11:
      Jockey3ME.hotc = 1;
      break;
    case 12:
      Jockey3ME.hotc = 2;
      break;
    case 13:
      Jockey3ME.hotc = 3;
      break;
    case 14:
      Jockey3ME.hotc = 4;
      break;
    case 15:
      Jockey3ME.hotc = 5;
      break;
    case 16:
      Jockey3ME.hotc = 6;
      break;
    case 17:
      Jockey3ME.hotc = 7;
      break;
    case 18:
      Jockey3ME.hotc = 8;
      break;
  }
  if (Jockey3ME.Timer_1 == 0 && engine.getValue(group,"hotcue_"+Jockey3ME.hotc+"_enabled") == 0 && value == 0x7F) {
    engine.setValue(group,"hotcue_"+Jockey3ME.hotc+"_activate",1);
    engine.setValue(group,"hotcue_"+Jockey3ME.hotc+"_activate",0);
  } else if (Jockey3ME.Timer_1 && engine.getValue(group,"hotcue_"+Jockey3ME.hotc+"_enabled") == 1 && value == 0x7F) {
    engine.setValue(group,"hotcue_"+Jockey3ME.hotc+"_clear",1);
    engine.setValue(group,"hotcue_"+Jockey3ME.hotc+"_clear",0);
  } else if (value == 0x7F) {
    engine.setValue(group,"hotcue_"+Jockey3ME.hotc+"_activate",1);
    engine.setValue(group,"hotcue_"+Jockey3ME.hotc+"_activate",0);
  }
}

Jockey3ME.Timer_1_off = function() {
  if (Jockey3ME.Timer_1 != 0) {
    engine.stopTimer(Jockey3ME.Timer_1);
    Jockey3ME.Timer_1 = 0;
  };
}

Jockey3ME.hotcue_clear = function (channel, control, value, status, group) {
   if (control == 0x09 && value == 0x7F) {
    Jockey3ME.Timer_1_off();
    Jockey3ME.Timer_1 = engine.beginTimer(100,"");
    midi.sendShortMsg(0x90,0x09,0x01);
    midi.sendShortMsg(0x91,0x09,0x01);
   } else {
    Jockey3ME.Timer_1_off();
    midi.sendShortMsg(0x90,0x09,0x00);
    midi.sendShortMsg(0x91,0x09,0x00);
   };
}

/*Jockey3ME.lfoDelay = function (channel, control, value, status, group) {
   var interval = 400;
   var min = 50;
   var max = 10000;
   var newVal = 0;
   if (value == 0x41) {
      var curVal = engine.getValue("[Flanger]","lfoDelay");
      newVal = curVal + interval;
      if (newVal > max) newVal = max;
   }
   else {
      var curVal = engine.getValue("[Flanger]","lfoDelay");
      newVal = curVal - interval;
      if (newVal < min) newVal = min;
   }
   engine.setValue("[Flanger]","lfoDelay",newVal);

   // Leds
   var getLedValue = 0;
   getLedValue = engine.getValue("[Flanger]","lfoDelay");
   getLedValue = getLedValue / 78.74; // Set Value 0-127
   getLedValue = parseInt(getLedValue);
   midi.sendShortMsg(0x90,0x20,getLedValue);
}

Jockey3ME.lfoDepth = function (channel, control, value, status, group) {
   var interval = 0.04;
   var min = 0;
   var max = 1;
   var newVal = 0;
   if (value == 0x41) {
      var curVal = engine.getValue("[Flanger]","lfoDepth");
      newVal = curVal + interval;
      if (newVal > max) newVal = max;
   }
   else {
      var curVal = engine.getValue("[Flanger]","lfoDepth");
      newVal = curVal - interval;
      if (newVal < min) newVal = min;
   }
   engine.setValue("[Flanger]","lfoDepth",newVal);

   // Leds
   var getLedValue = 0;
   getLedValue = engine.getValue("[Flanger]","lfoDepth");
   getLedValue = getLedValue * 127; // Sets Value 0-127
   getLedValue = parseInt(getLedValue);
   midi.sendShortMsg(0x90,0x1F,getLedValue);
}

Jockey3ME.lfoPeriod = function (channel, control, value, status, group) {
   var interval = 81250;
   var min = 50000;
   var max = 2000000;
   var newVal = 0;
   if (value == 0x41) {
      var curVal = engine.getValue("[Flanger]","lfoPeriod");
      newVal = curVal + interval;
      if (newVal > max) newVal = max;
   }
   else {
      var curVal = engine.getValue("[Flanger]","lfoPeriod");
      newVal = curVal - interval;
      if (newVal < min) newVal = min;
   }
   engine.setValue("[Flanger]","lfoPeriod",newVal);

   // Leds
   var getLedValue = 0;
   getLedValue = engine.getValue("[Flanger]","lfoPeriod");
   getLedValue = getLedValue / 15748.0315; // Sets Value 0-127
   getLedValue = parseInt(getLedValue);
   midi.sendShortMsg(0x90,0x1E,getLedValue);
}
*/

Jockey3ME.effectParam = function (channel, control, value, status, group) { //////////////
  var currentDeck = parseInt(group.substring(23,24));
  var EncoderKnopDryWet = 0;
  var EncoderKnopFX = 0;
  var newVal = 0;
  var interval = 0.04;
  var min = 0;
  var max = 1;
  switch (control) {
    case 29:
      EncoderKnopDryWet = 1;
      break;
    case 30:
      EncoderKnopFX = 1;
      break;
    case 31:
      EncoderKnopFX = 2;
      break;
    case 32:
      EncoderKnopFX = 3;
      break;
  }
  if (!EncoderKnopDryWet) {
    if (value == 0x41) {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX);
      newVal = curVal + interval;
      if (newVal > max) newVal = max;
    } else {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX);
      newVal = curVal - interval;
      if (newVal < min) newVal = min;
    }
  } else {
    if (value == 0x41) {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "]", "mix");
      newVal = curVal + interval;
      if (newVal > max) newVal = max;
    } else {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "]", "mix");
      newVal = curVal - interval;
      if (newVal < min) newVal = min;
    }
  }
  // print("Effect " + EncoderKnopFX + " Val " + curVal);
  // print("getParameterForValue " + engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX));
  switch (Jockey3ME.ifEffectLoaded(value, currentDeck)) {
    case 1:
      if (EncoderKnopFX > 1) {
        EncoderKnopFX = 0;
      }
      break;
    case 2:
      if (EncoderKnopFX > 2) {
        EncoderKnopFX = 0;
      }
      break;
  }
  if (EncoderKnopDryWet) {
    engine.setParameter("[EffectRack1_EffectUnit" + currentDeck + "]", "mix", newVal);
  } else if (EncoderKnopFX) {
    engine.setParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX, newVal);
  };

  // Leds
  var getLedValue = 0;
  if (status == 0xB0) {
    status = 0x90;
  } else {
    status = 0x91;
  }
  if (EncoderKnopFX) {
    getLedValue = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX);
    getLedValue = getLedValue * 127;
    getLedValue = parseInt(getLedValue);
    midi.sendShortMsg(status,control,getLedValue);
  } else if (EncoderKnopDryWet) {
    getLedValue = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "]", "mix");
    getLedValue = getLedValue * 127;
    getLedValue = parseInt(getLedValue);
    midi.sendShortMsg(status,control,getLedValue);
  };
}

// Browser Knop to Browse the Playlist
Jockey3ME.TraxEncoderTurn = function (channel, control, value, status, group) {
    var newValue = (value-64);
   
   engine.setValue(group,"SelectTrackKnob",newValue);
   
}

// Browser Knop with Shift to Browse the Playlist Tree
Jockey3ME.ShiftTraxEncoderTurn = function (channel, control, value, status, group) {
    var newValue = (value-64);
   
   if (newValue == 1) engine.setValue(group,"SelectNextPlaylist",newValue);
   else engine.setValue(group,"SelectPrevPlaylist",1);
   
   // engine.setValue(group,"SelectTrackKnob",newValue);
   
}

Jockey3ME.loop_double_halve = function (channel, control, value, status, group) {
  var newValue = (value-64);

  if (newValue == 1) {
    engine.setValue(group,"loop_double",1);
    engine.setValue(group,"loop_double",0);
  } else {
    engine.setValue(group,"loop_halve",1);
    engine.setValue(group,"loop_halve",0);
  }
}

Jockey3ME.crossfader = function (channel, control, value, status, group) {
  var newValue = 0;
  if (control == 0x37 && !Jockey3ME.crossfaderScratch) {
    newValue = (value / 63.5);
    newValue = (newValue - 1);
    engine.setValue(group,"crossfader",newValue);
  } else if (control == 0x37 && Jockey3ME.crossfaderScratch) {
    if (value == 127) {
      engine.setValue(group,"crossfader",1);
    } else if (value == 0) {
      engine.setValue(group,"crossfader",-1);
    } else {
      engine.setValue(group,"crossfader",0);
    }
  } else {
    if (value <= 126) {
      script.crossfaderCurve(value, 0, 126);
      Jockey3ME.crossfaderScratch = false;
    } else {
      Jockey3ME.crossfaderScratch = true;
    }
  }
}

Jockey3ME.ifEffectLoaded = function (value, index) {
  if (value) {
    var numParameters = engine.getValue("[EffectRack1_EffectUnit" + index + "_Effect1]", "num_parameters");
  }
  return numParameters;
}