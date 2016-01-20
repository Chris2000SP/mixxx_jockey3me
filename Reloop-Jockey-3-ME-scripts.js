function Jockey3ME() {}

// Variables
Jockey3ME.EffectLedMeter = 0;
Jockey3ME.EffectLedMeterValue = 1;
Jockey3ME.LedMeterShowValue = 1;
Jockey3ME.LedMeterShowValueTwo = false;
Jockey3ME.VuMeter = 0;
Jockey3ME.scratching = [];
Jockey3ME.hotcueClearVal = 0;
Jockey3ME.crossfaderScratch = false;
Jockey3ME.num_effectsValue = [0,0,0,0];
Jockey3ME.effectsAvailable = 5; // Sets how many Effects are Loadable
Jockey3ME.move_beat_value = 4; // Sets how many Beats Jumping when "MOVE" is Turned
Jockey3ME.CUP_value = 0;
Jockey3ME.MixerDeck1 = 0;
Jockey3ME.MixerDeck2 = 0;
Jockey3ME.noVolHopValue = [false,false,false,false,false];

// Functions
Jockey3ME.EffectLedMeterShow = function () {
  midi.sendShortMsg(0x90,0x1D,Jockey3ME.EffectLedMeterValue);
  midi.sendShortMsg(0x91,0x1D,Jockey3ME.EffectLedMeterValue);
  Jockey3ME.EffectLedMeterValue += 2;
  if (Jockey3ME.EffectLedMeterValue >= 127) {
    engine.stopTimer(Jockey3ME.EffectLedMeter);
    Jockey3ME.EffectLedMeter = 0;

    // Sets Effect Leds
    	/*for (var i = 1, j = 176; i <= 4; i++) {
			Jockey3ME.effectSelectLedSet(j,i);
			j++;
		}*/
		for (var i = 1; i <= 4; i++) {
			for (var j = 1; j <= 3; j++) {
				engine.trigger("[EffectRack1_EffectUnit" + i + "_Effect1]", "parameter" + j);
			}
			engine.trigger("[EffectRack1_EffectUnit" + i + "]", "mix");
		}
  };
}
// Main LedShow Script
Jockey3ME.LedMeterShow = function() {
  midi.sendShortMsg(0x90,0x21,Jockey3ME.LedMeterShowValue);
  midi.sendShortMsg(0x91,0x21,Jockey3ME.LedMeterShowValue);
  if (Jockey3ME.LedMeterShowValueTwo == false) {
    ++Jockey3ME.LedMeterShowValue;
  } else {
    --Jockey3ME.LedMeterShowValue;
  }
  if (Jockey3ME.LedMeterShowValue > 10) Jockey3ME.LedMeterShowValueTwo = true;
  // Stop The LedShow and Start Scanning VuMeter
  if (Jockey3ME.LedMeterShowValueTwo && Jockey3ME.LedMeterShowValue < 0) {
    engine.stopTimer(Jockey3ME.LedMeterShowTimer);
    Jockey3ME.LedMeterShowTimer = 0;
    Jockey3ME.EffectLedMeter = engine.beginTimer(20,"Jockey3ME.EffectLedMeterShow()");
  };
}

Jockey3ME.LedShowBegin = function () {
  Jockey3ME.LedMeterShowTimer = engine.beginTimer(40,"Jockey3ME.LedMeterShow()");
}

// Init Script at Programmstart
Jockey3ME.init = function () {
  for (var i = 1; i < 120; i++) {
    midi.sendShortMsg(0x90,i,0x7F);
    midi.sendShortMsg(0x91,i,0x7F);
    midi.sendShortMsg(0x92,i,0x7F);
    midi.sendShortMsg(0x93,i,0x7F);
  };
  for (var j = 1; j < 120; j++) {
    midi.sendShortMsg(0x90,j,0x00);
    midi.sendShortMsg(0x91,j,0x00);
    midi.sendShortMsg(0x92,j,0x00);
    midi.sendShortMsg(0x93,j,0x00);
  };
  Jockey3ME.LedShowBeginTimer = engine.beginTimer(500,"Jockey3ME.LedShowBegin()",1); // LedShow Script Starts Here after 500ms
	for (var i = 1; i <= 4; i++) {
		for (var j = 1; j <= 3; j++) {
			engine.connectControl("[EffectRack1_EffectUnit" + i + "_Effect1]","parameter" + j,"Jockey3ME.FX_Param_Led");
		}
		engine.connectControl("[EffectRack1_EffectUnit" + i + "]","mix","Jockey3ME.FX_DryWet_Led");
	}
}

Jockey3ME.shutdown = function () {
  for (var i = 1; i <= 160; i++) {
    midi.sendShortMsg(0x90,i,0x00);
    midi.sendShortMsg(0x91,i,0x00);
    midi.sendShortMsg(0x92,i,0x00);
    midi.sendShortMsg(0x93,i,0x00);
  };
  engine.stopTimer(Jockey3ME.VuMeter);
}

// The button that enables/disables scratching
Jockey3ME.wheelTouch = function (channel, control, value, status, group) {
  var currentDeck = parseInt(group.substring(8,9));
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
  var currentDeck = parseInt(group.substring(8,9));
    // See if we're scratching. If not, skip this.
    if (!engine.isScratching(currentDeck)) {
      engine.setValue(group, "jog", newValue);
      return;
   }
    engine.scratchTick(currentDeck,newValue);
}

// Hotcues
Jockey3ME.hotcue_activate = function (channel, control, value, status, group) {
	var hotc = control - 10;

	if (!Jockey3ME.hotcueClearVal && value == 0x7F) {
		engine.setValue(group,"hotcue_"+hotc+"_activate",1);
	} else if (Jockey3ME.hotcueClearVal && engine.getValue(group,"hotcue_"+hotc+"_enabled") == 1 && value == 0x7F) {
		engine.setValue(group,"hotcue_"+hotc+"_clear",1);
	} else if (value == 0x00) {
		engine.setValue(group,"hotcue_"+hotc+"_activate",0);
	}
}

Jockey3ME.hotcue_clear = function (channel, control, value, status, group) {
   if (control == 0x09 && value == 0x7F) {
    Jockey3ME.hotcueClearVal = 1;
    midi.sendShortMsg(status,control,0x01);
   } else {
    Jockey3ME.hotcueClearVal = 0;
    midi.sendShortMsg(status,control,0x00);
   };
}

// Effect Sections
Jockey3ME.effectParam = function (channel, control, value, status, group) {
  var currentDeck = parseInt(group.substring(23,24));
  var EncoderKnopDryWet = 0;
  var EncoderKnopFX = 0;
  var newVal = 0;
  var interval = 0.04;
  var min = 0;
  var max = 1;
	if (control == 29) {
		EncoderKnopDryWet = 1;
	} else {
		EncoderKnopFX = control - 29;
	}
  if (!EncoderKnopDryWet) {
    if (value == 0x41) {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX);
      newVal = curVal + interval;
    } else {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX);
      newVal = curVal - interval;
    }
  } else {
    if (value == 0x41) {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "]", "mix");
      newVal = curVal + interval;
    } else {
      var curVal = engine.getParameter("[EffectRack1_EffectUnit" + currentDeck + "]", "mix");
      newVal = curVal - interval;
    }
  }
  switch (engine.getValue("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "num_parameters")) {
    case 1:
      if (EncoderKnopFX > 1) EncoderKnopFX = 0;
      break;
    case 2:
      if (EncoderKnopFX > 2) EncoderKnopFX = 0;
      break;
  }
  if (EncoderKnopDryWet) {
    engine.setParameter("[EffectRack1_EffectUnit" + currentDeck + "]", "mix", newVal);
  } else if (EncoderKnopFX) {
    engine.setParameter("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX, newVal);
  };

  // Leds

	if (EncoderKnopFX) {
		engine.trigger("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "parameter" + EncoderKnopFX);
	} else if (EncoderKnopDryWet) {
		engine.trigger("[EffectRack1_EffectUnit" + currentDeck + "]", "mix");
	}
}

Jockey3ME.FX_Param_Led = function (group, value, control) {
	var currentDeck = parseInt(group.substring(23,24));
	var knop = parseInt(control.substring(9,10));
	midi.sendShortMsg(0x90+(currentDeck-1),0x1E+(knop-1),(value*127));
	print("FX Param Led on Deck: " + currentDeck + " Knop: " + knop + " has value: " + value);
}

Jockey3ME.FX_DryWet_Led = function (group, value, control) {
	var currentDeck = parseInt(group.substring(23,24));
	midi.sendShortMsg(0x90+(currentDeck-1),0x1D,(value*127));
	print("FX DryWet Led on Deck: " + currentDeck + " has value: " + value);
}

Jockey3ME.effectSelectLedSetNumEffect = function (currentDeck, status, control, value) {
  // var ledValue = engine.getValue("[EffectRack1_EffectUnit" + currentDeck + "]", "num_effects");
  var ledValue = Jockey3ME.effectsAvailable; // num_effects returns how many effects in Unit is, not what is available. Set to 5
  if ((Jockey3ME.num_effectsValue[currentDeck - 1] + value) > ledValue) {
    Jockey3ME.num_effectsValue[currentDeck - 1] = 1;
  } else {
    Jockey3ME.num_effectsValue[currentDeck - 1] += value;
  }
  var newLedValue = parseInt((Jockey3ME.num_effectsValue[currentDeck - 1] / ledValue) * 127);
  midi.sendShortMsg((status-32),control,newLedValue);
}

Jockey3ME.effectSelect = function (channel, control, value, status, group) {
  var currentDeck = parseInt(group.substring(23,24));
  engine.setValue("[EffectRack1_EffectUnit" + currentDeck + "]", "chain_selector", (value-64));

  // Set Leds
  // engine.beginTimer(100, "Jockey3ME.effectSelectLedSet(" + status + "," + currentDeck + ")",1);
	var num_parameters = engine.getValue("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]", "num_parameters");
	if (num_parameters > 3) {
		num_parameters = 3;
	}
	for (var i = 1; i <= num_parameters; i++) {
		engine.trigger("[EffectRack1_EffectUnit" + currentDeck + "_Effect1]","parameter" + i);
	}
	engine.trigger("[EffectRack1_EffectUnit" + currentDeck + "]","mix");
  Jockey3ME.effectSelectLedSetNumEffect(currentDeck,status,92,(value-64));
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
}

Jockey3ME.loop_double_halve = function (channel, control, value, status, group) {
  var newValue = (value-64);

  if (newValue == 1) {
    engine.setValue(group,"loop_double",1);
  } else {
    engine.setValue(group,"loop_halve",1);
  }
}

Jockey3ME.move_beat = function (channel, control, value, status, group) {
  var newValue = (value-64);
  engine.setValue(group,"beatjump",(newValue*Jockey3ME.move_beat_value));
}

Jockey3ME.crossfader = function (channel, control, value, status, group) {
  var newValue = 0;
  if (control == 0x37 && !Jockey3ME.crossfaderScratch) {
    newValue = ((value / 63.5) - 1);
    engine.setValue(group,"crossfader",newValue);
  } else if (control == 0x37 && Jockey3ME.crossfaderScratch) {
    switch (value) {
      case 127:
        engine.setValue(group,"crossfader",1);
        break;
      case 126:
        engine.setValue(group,"crossfader",0.96875);
        break;
      case 125:
        engine.setValue(group,"crossfader",0.953125);
        break;
      case 2:
        engine.setValue(group,"crossfader",-0.953125);
        break;
      case 1:
        engine.setValue(group,"crossfader",-0.96875);
        break;
      case 0:
        engine.setValue(group,"crossfader",-1);
        break;
      default:
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

Jockey3ME.CUP = function (channel, control, value, status, group) {
  if (value == 0x7F) {
    engine.setValue(group,"cue_default",1);
    engine.setValue(group,"cue_default",0);
    midi.sendShortMsg(status,control,127);
  } else {
    engine.setValue(group,"play",1);
    midi.sendShortMsg(status,control,0);
  }
}

Jockey3ME.MixerVol = function (channel, control, value, status, group) {
  var currentDeck = parseInt(group.substring(8,9));
  if ((Jockey3ME.MixerDeck1 == 1 && currentDeck == 1) || (Jockey3ME.MixerDeck2 == 1 && currentDeck == 2)) {
    currentDeck += 2;
  }
  if (control == 0x2D || control == 0x6C) {
	var noGainHop = engine.getParameter("[Channel" + currentDeck + "]","pregain");
	if (!(!((noGainHop - (value / 127)) < 0.04) || !((noGainHop - (value / 127)) > -0.04))) {
		Jockey3ME.noVolHopValue[1] = false;
	}
	if (!Jockey3ME.noVolHopValue[1]) {
		engine.setParameter("[Channel" + currentDeck + "]","pregain",(value / 127));
    }
  } else {
    var noVolHop = engine.getParameter("[Channel" + currentDeck + "]","volume");
    if (!(!((noVolHop - (value / 127)) < 0.04) || !((noVolHop - (value / 127)) > -0.04))) {
      Jockey3ME.noVolHopValue[0] = false;
    }
    if (!Jockey3ME.noVolHopValue[0]) {
      engine.setParameter("[Channel" + currentDeck + "]","volume",(value / 127));
    }
  }
}

Jockey3ME.DeckSwitch = function (channel, control, value, status, group) {
  if (control == 0x3C && value == 0x7F) {
    Jockey3ME.MixerDeck1 = 1;
  } else if (control == 0x3C && value == 0x00) {
    Jockey3ME.MixerDeck1 = 0;
  } else if (control == 0x3F && value == 0x7F) {
    Jockey3ME.MixerDeck2 = 1;
  } else if (control == 0x3F && value == 0x00) {
    Jockey3ME.MixerDeck2 = 0;
  }
  for (var i = 0; i < Jockey3ME.noVolHopValue.length; i++) {
  	Jockey3ME.noVolHopValue[i] = true;
  }
  // Jockey3ME.noVolHopValue[0] = true;
}

Jockey3ME.EQ = function (channel, control, value, status, group) {
  var currentDeck = parseInt(group.substring(24,25));
  if ((Jockey3ME.MixerDeck1 == 1 && currentDeck == 1) || (Jockey3ME.MixerDeck2 == 1 && currentDeck == 2)) {
    currentDeck += 2;
  }
  switch (control) {
    case 0x2E:
      var eqKnop = 3;
      break;
    case 0x2F:
      var eqKnop = 2;
      break;
    case 0x30:
      var eqKnop = 1;
      break;
    case 0x6D:
      var eqKnop = 3;
      break;
    case 0x6E:
      var eqKnop = 2;
      break;
    case 0x6F:
      var eqKnop = 1;
      break;
    default:
      print("Error on EQ chosing");
  }
  var noHighHop = engine.getParameter("[EqualizerRack1_[Channel" + currentDeck + "]_Effect1]","parameter" + eqKnop);
  if (!(!((noHighHop - (value / 127)) < 0.04) || !((noHighHop - (value / 127)) > -0.04))) {
  	Jockey3ME.noVolHopValue[eqKnop + 1] = false;
  }
  if (!Jockey3ME.noVolHopValue[eqKnop + 1]) {
  	engine.setParameter("[EqualizerRack1_[Channel" + currentDeck + "]_Effect1]","parameter" + eqKnop, (value / 127));
  }
}
