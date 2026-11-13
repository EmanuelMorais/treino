// Original animated figures, one per movement family, so each exercise shows
// the motion itself instead of a timestamp inside a long routine video.
// Side view unless noted; the floor is at y=128 in a 200×140 box.
// Each pose names the same joints, and the browser tweens between them (SMIL),
// so the figure needs no script and works offline.
(function () {
  const F = 128; // floor
  // Standing figure, side view. Joints: head, N (neck/shoulder), H (hip), K/A (knee/ankle), E/W (elbow/hand).
  const stand = { head: [100, 30], N: [100, 42], H: [100, 80], legs: [[[100, 80], [100, 104], [100, F]]], arms: [[[100, 42], [100, 62], [100, 82]]] };
  const front = { head: [100, 30], N: [100, 42], H: [100, 80], legs: [[[100, 80], [92, 104], [90, F]], [[100, 80], [108, 104], [110, F]]], arms: [[[100, 42], [88, 62], [86, 80]], [[100, 42], [112, 62], [114, 80]]] };
  const hinge = { head: [128, 48], N: [118, 56], H: [84, 80], legs: [[[84, 80], [94, 102], [100, F]]], arms: [[[118, 56], [118, 76], [118, 96]]] };
  const lying = { head: [26, 114], N: [38, 116], H: [80, 116], legs: [[[80, 116], [96, 98], [104, F]]], arms: [[[38, 116], [52, 118], [66, 118]]] };
  const bench = { head: [30, 92], N: [44, 96], H: [92, 98], legs: [[[92, 98], [108, 110], [114, F]]], arms: [[[44, 96], [40, 82], [50, 72]]], props: ['bench'] };
  const kneel4 = { head: [40, 64], N: [52, 70], H: [112, 72], legs: [[[112, 72], [116, F], [142, F]], [[112, 72], [116, F], [142, F]]], arms: [[[52, 70], [52, 98], [52, F]], [[52, 70], [52, 98], [52, F]]] };

  const DEMOS = {
    squat: { label: 'agachamento', weight: 'db-chest', a: { ...stand, arms: [[[100, 42], [100, 60], [110, 52]]] },
      b: { head: [102, 52], N: [98, 64], H: [88, 98], legs: [[[88, 98], [116, 102], [100, F]]], arms: [[[98, 64], [102, 82], [112, 74]]] } },
    split: { label: 'afundo', weight: 'db', a: { head: [100, 30], N: [100, 42], H: [100, 80], legs: [[[100, 80], [114, 104], [120, F]], [[100, 80], [90, 104], [82, F]]], arms: [[[100, 42], [100, 62], [100, 82]]] },
      b: { head: [100, 52], N: [100, 64], H: [100, 102], legs: [[[100, 102], [122, 108], [120, F]], [[100, 102], [86, 122], [76, F]]], arms: [[[100, 64], [100, 84], [100, 104]]] } },
    hinge: { label: 'peso morto romeno', weight: 'db', a: { ...stand, arms: [[[100, 42], [100, 62], [102, 82]]] }, b: hinge },
    bridge: { label: 'ponte de glúteos', weight: 'none', a: lying, b: { ...lying, H: [82, 94], legs: [[[82, 94], [98, 96], [104, F]]] } },
    press: { label: 'supino', weight: 'db', a: bench, b: { ...bench, arms: [[[44, 96], [46, 72], [50, 52]]] } },
    pushup: { label: 'flexão', weight: 'none', a: { head: [32, 58], N: [44, 66], H: [100, 84], legs: [[[100, 84], [130, 98], [158, F]]], arms: [[[44, 66], [44, 96], [44, F]]] },
      b: { head: [32, 88], N: [44, 96], H: [100, 102], legs: [[[100, 102], [130, 110], [158, F]]], arms: [[[44, 96], [62, 112], [44, F]]] } },
    pike: { label: 'flexão em pike', weight: 'none', a: { head: [50, 86], N: [60, 76], H: [104, 44], legs: [[[104, 44], [122, 84], [140, F]]], arms: [[[60, 76], [52, 100], [44, F]]] },
      b: { head: [42, 108], N: [52, 98], H: [102, 54], legs: [[[102, 54], [122, 90], [140, F]]], arms: [[[52, 98], [64, 114], [44, F]]] } },
    row: { label: 'remada', weight: 'db', a: { ...hinge, arms: [[[118, 56], [118, 76], [116, 96]]] }, b: { ...hinge, arms: [[[118, 56], [134, 64], [124, 74]]] } },
    press_overhead: { label: 'press de ombros', weight: 'db', a: { ...stand, arms: [[[100, 42], [112, 52], [106, 38]]] }, b: { ...stand, arms: [[[100, 42], [104, 26], [104, 10]]] } },
    lateral_raise: { label: 'elevação lateral', weight: 'db', a: front, b: { ...front, arms: [[[100, 42], [78, 46], [58, 42]], [[100, 42], [122, 46], [142, 42]]] } },
    reverse_fly: { label: 'abertura invertida', weight: 'band', a: { ...front, arms: [[[100, 42], [92, 58], [96, 66]], [[100, 42], [108, 58], [104, 66]]] }, b: { ...front, arms: [[[100, 42], [78, 48], [58, 44]], [[100, 42], [122, 48], [142, 44]]] } },
    fly: { label: 'abertura', weight: 'db', a: { ...front, arms: [[[100, 42], [78, 48], [58, 44]], [[100, 42], [122, 48], [142, 44]]] }, b: { ...front, arms: [[[100, 42], [86, 52], [94, 34]], [[100, 42], [114, 52], [106, 34]]] } },
    pulldown: { label: 'puxada vertical', weight: 'bar', a: { ...front, arms: [[[100, 42], [84, 24], [78, 8]], [[100, 42], [116, 24], [122, 8]]] }, b: { ...front, arms: [[[100, 42], [80, 58], [86, 42]], [[100, 42], [120, 58], [114, 42]]] } },
    curl: { label: 'curl de bíceps', weight: 'db', a: stand, b: { ...stand, arms: [[[100, 42], [100, 62], [116, 46]]] } },
    pushdown: { label: 'extensão de tríceps', weight: 'band', a: { ...stand, arms: [[[100, 42], [100, 62], [116, 50]]] }, b: { ...stand, arms: [[[100, 42], [100, 62], [116, 84]]] } },
    triceps_overhead: { label: 'extensão de tríceps acima da cabeça', weight: 'db', a: { head: [100, 44], N: [100, 56], H: [100, 90], legs: [[[100, 90], [100, 110], [100, F]]], arms: [[[100, 56], [110, 40], [92, 34]]] },
      b: { head: [100, 44], N: [100, 56], H: [100, 90], legs: [[[100, 90], [100, 110], [100, F]]], arms: [[[100, 56], [106, 36], [110, 16]]] } },
    triceps_lying: { label: 'extensão de tríceps deitado', weight: 'db', a: { ...bench, arms: [[[44, 96], [44, 74], [30, 66]]] }, b: { ...bench, arms: [[[44, 96], [44, 74], [46, 52]]] } },
    calf_raise: { label: 'elevação de gémeos', weight: 'none', a: { ...stand, legs: [[[100, 80], [100, 104], [100, F]]], foot: [[100, F], [114, F]] },
      b: { head: [100, 24], N: [100, 36], H: [100, 74], legs: [[[100, 74], [100, 98], [100, 120]]], arms: [[[100, 36], [100, 56], [100, 76]]], foot: [[100, 120], [114, F]] } },
    carry: { label: 'caminhada com carga', weight: 'db', a: { ...stand, legs: [[[100, 80], [108, 104], [114, F]], [[100, 80], [94, 106], [86, F]]] }, b: { ...stand, legs: [[[100, 80], [94, 104], [86, F]], [[100, 80], [108, 106], [114, F]]] } },
    plank: { label: 'prancha', weight: 'none', a: { head: [38, 80], N: [50, 88], H: [100, 94], legs: [[[100, 94], [128, 104], [158, F]]], arms: [[[50, 88], [44, 120], [70, 120]]] },
      b: { head: [38, 80], N: [50, 88], H: [100, 92], legs: [[[100, 92], [128, 103], [158, F]]], arms: [[[50, 88], [44, 120], [70, 120]]] } },
    side_plank: { label: 'prancha lateral', weight: 'none', a: { head: [42, 72], N: [52, 82], H: [106, 102], legs: [[[106, 102], [133, 112], [160, F]]], arms: [[[52, 82], [52, 120], [30, 120]]] },
      b: { head: [42, 72], N: [52, 82], H: [106, 100], legs: [[[106, 100], [133, 111], [160, F]]], arms: [[[52, 82], [52, 120], [30, 120]]] } },
    deadbug: { label: 'dead bug', weight: 'none', a: { ...lying, legs: [[[80, 116], [84, 92], [102, 92]], [[80, 116], [84, 92], [102, 92]]], arms: [[[38, 116], [38, 92], [38, 68]], [[38, 116], [38, 92], [38, 68]]] },
      b: { ...lying, legs: [[[80, 116], [106, 102], [132, 106]], [[80, 116], [84, 92], [102, 92]]], arms: [[[38, 116], [20, 106], [4, 112]], [[38, 116], [38, 92], [38, 68]]] } },
    bird_dog: { label: 'bird dog', weight: 'none', a: kneel4, b: { ...kneel4, arms: [[[52, 70], [34, 66], [14, 62]], [[52, 70], [52, 98], [52, F]]], legs: [[[112, 72], [144, 74], [176, 76]], [[112, 72], [116, F], [142, F]]] } },
    cat_cow: { label: 'gato-vaca', weight: 'none', a: { ...kneel4, head: [40, 70], M: [82, 54] }, b: { ...kneel4, head: [40, 58], M: [82, 84] } },
    reverse_crunch: { label: 'crunch invertido', weight: 'none', a: { ...lying, legs: [[[80, 116], [84, 92], [102, 92]]] }, b: { ...lying, H: [78, 108], legs: [[[78, 108], [56, 90], [72, 76]]] } },
    heel_taps: { label: 'toques de calcanhar', weight: 'none', a: { ...lying, legs: [[[80, 116], [84, 92], [102, 92]], [[80, 116], [84, 92], [102, 92]]] }, b: { ...lying, legs: [[[80, 116], [96, 102], [114, 114]], [[80, 116], [84, 92], [102, 92]]] } },
    ab_wheel: { label: 'roda abdominal', weight: 'wheel', a: { head: [58, 62], N: [66, 70], H: [90, 96], legs: [[[90, 96], [96, F], [122, F]]], arms: [[[66, 70], [56, 90], [48, 110]]] },
      b: { head: [44, 88], N: [52, 98], H: [92, 110], legs: [[[92, 110], [96, F], [122, F]]], arms: [[[52, 98], [30, 110], [12, 118]]] } },
    leg_extension: { label: 'extensão de pernas', weight: 'none', a: { head: [80, 46], N: [80, 58], H: [80, 96], legs: [[[80, 96], [106, 96], [106, F]]], arms: [[[80, 58], [84, 78], [96, 90]]], props: ['seat'] },
      b: { head: [80, 46], N: [80, 58], H: [80, 96], legs: [[[80, 96], [106, 96], [132, 96]]], arms: [[[80, 58], [84, 78], [96, 90]]], props: ['seat'] } },
    leg_curl: { label: 'curl de pernas', weight: 'none', a: { head: [30, 114], N: [42, 116], H: [96, 116], legs: [[[96, 116], [120, 116], [144, 116]]], arms: [[[42, 116], [30, 106], [18, 116]]] },
      b: { head: [30, 114], N: [42, 116], H: [96, 116], legs: [[[96, 116], [120, 116], [118, 88]]], arms: [[[42, 116], [30, 106], [18, 116]]] } },
    abduction: { label: 'abdução da anca', weight: 'none', a: { ...front, H: [100, 96], legs: [[[100, 96], [96, 108], [94, F]], [[100, 96], [104, 108], [106, F]]], arms: [[[100, 42], [90, 66], [92, 90]], [[100, 42], [110, 66], [108, 90]]], props: ['seat'] },
      b: { ...front, H: [100, 96], legs: [[[100, 96], [80, 108], [70, F]], [[100, 96], [120, 108], [130, F]]], arms: [[[100, 42], [90, 66], [92, 90]], [[100, 42], [110, 66], [108, 90]]], props: ['seat'] } },
    legpress: { label: 'prensa de pernas', weight: 'sled', a: { head: [36, 66], N: [44, 76], H: [72, 104], legs: [[[72, 104], [92, 82], [112, 84]]], arms: [[[44, 76], [52, 92], [64, 100]]] },
      b: { head: [36, 66], N: [44, 76], H: [72, 104], legs: [[[72, 104], [108, 76], [136, 66]]], arms: [[[44, 76], [52, 92], [64, 100]]] } },
  };
  DEMOS.adduction = { label: 'adução da anca', weight: 'none', a: DEMOS.abduction.b, b: DEMOS.abduction.a };

  // Exercise id → demo. Weight overrides come from the id prefix.
  const BY_ID = {
    squat: 'squat', goblet: 'squat', 'sit-stand': 'squat', 'db-front-squat': 'squat', 'db-sumo': 'squat', 'back-squat': 'squat', 'front-squat': 'squat', legpress: 'legpress',
    lunge: 'split', 'reverse-lunge': 'split', 'side-lunge': 'split', stepup: 'split', 'db-reverse-lunge': 'split', 'db-split-squat': 'split', bulgarian: 'split',
    'db-rdl': 'hinge', 'bar-rdl': 'hinge', 'db-deadlift': 'hinge', 'staggered-rdl': 'hinge', 'single-db-rdl': 'hinge', 'bar-deadlift': 'hinge',
    bridge: 'bridge', 'single-bridge': 'bridge', 'db-bridge': 'bridge', 'bar-hip-thrust': 'bridge',
    pushup: 'pushup', 'knee-pushup': 'pushup', 'wall-pushup': 'pushup', 'pike-pushup': 'pike',
    'floor-press': 'press', 'bench-press': 'press', 'machine-press': 'press', 'incline-db-press': 'press', 'bar-bench': 'press', 'band-chest-press': 'press',
    'db-row': 'row', 'band-row': 'row', 'machine-row': 'row', 'chest-supported-row': 'row', 'db-bent-row': 'row', 'bar-row': 'row', 'band-anchor-row': 'row', 'cable-row': 'row',
    'band-lat': 'pulldown', 'lat-pulldown': 'pulldown',
    'prone-w': 'reverse_fly', 'db-reverse-fly': 'reverse_fly', 'band-pullapart': 'reverse_fly', 'band-facepull': 'reverse_fly', 'reverse-machine': 'reverse_fly',
    'seated-press': 'press_overhead', 'kneeling-press': 'press_overhead', 'standing-db-press': 'press_overhead', 'bar-press': 'press_overhead', 'band-overhead': 'press_overhead', 'machine-overhead': 'press_overhead',
    'lateral-raise': 'lateral_raise', 'db-fly': 'fly', 'pec-deck': 'fly', 'leg-extension': 'leg_extension', 'leg-curl': 'leg_curl', 'hip-abduction': 'abduction', 'hip-adduction': 'adduction',
    curl: 'curl', 'hammer-curl': 'curl', 'alternating-curl': 'curl', 'bar-curl': 'curl', 'band-curl': 'curl', 'cable-curl': 'curl',
    'lying-db-triceps': 'triceps_lying', 'overhead-db-triceps': 'triceps_overhead', 'band-triceps': 'pushdown', 'cable-triceps': 'pushdown',
    calf: 'calf_raise', 'single-calf': 'calf_raise', 'db-calf': 'calf_raise', 'machine-calf': 'calf_raise',
    deadbug: 'deadbug', 'bird-dog': 'bird_dog', plank: 'plank', 'side-plank': 'side_plank', 'side-plank-knees': 'side_plank', 'reverse-crunch': 'reverse_crunch', 'heel-taps': 'heel_taps', 'ab-wheel': 'ab_wheel',
    'cat-cow': 'cat_cow', 'farmer-carry': 'carry', 'suitcase-carry': 'carry',
  };
  const PATTERN_FALLBACK = { squat: 'squat', hinge: 'hinge', push: 'press', pull: 'row', vertical_pull: 'pulldown', shoulders: 'press_overhead', scapular: 'reverse_fly', arms: 'curl', calves: 'calf_raise', core: 'plank', carry: 'carry' };

  function weightFor(id, demo) {
    if (demo.weight === 'none' || demo.weight === 'wheel' || demo.weight === 'sled') return demo.weight;
    if (/^(bar-|back-squat|front-squat)/.test(id)) return id.includes('squat') ? 'bar-shoulders' : 'bar';
    if (/^band-/.test(id)) return 'band';
    if (/^(machine-|cable-|lat-pulldown|pec-deck|leg-)/.test(id) || /^(pushup|knee-pushup|wall-pushup|sit-stand|prone-w|bridge|single-bridge)$/.test(id)) return 'none';
    return demo.weight;
  }

  function demoFor(exercise) {
    const id = exercise?.libraryId || exercise?.id || '';
    const key = BY_ID[id] || PATTERN_FALLBACK[exercise?.pattern] || null;
    if (!key || !DEMOS[key]) return null;
    return { key, label: DEMOS[key].label, weight: weightFor(id, DEMOS[key]) };
  }

  const pts = list => list.map(p => p.join(',')).join(' ');
  function anim(attr, a, b, dur) {
    if (a === b) return '';
    return `<animate attributeName="${attr}" values="${a};${b};${a}" keyTimes="0;0.5;1" dur="${dur}s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/>`;
  }
  function poly(a, b, cls, dur) { return `<polyline class="${cls}" points="${pts(a)}">${anim('points', pts(a), pts(b), dur)}</polyline>`; }
  function torso(p) { return [p.N, p.M || [(p.N[0] + p.H[0]) / 2, (p.N[1] + p.H[1]) / 2], p.H]; }
  function weightShapes(kind, a, b, dur) {
    const hands = p => p.arms.map(arm => arm[2]);
    const ha = hands(a), hb = hands(b);
    if (kind === 'db' || kind === 'db-chest') return ha.map((h, i) => poly([[h[0] - 7, h[1]], [h[0] + 7, h[1]]], [[hb[i][0] - 7, hb[i][1]], [hb[i][0] + 7, hb[i][1]]], 'demo-weight', dur)).join('');
    if (kind === 'bar') return ha.length > 1 ? poly([ha[0], ha[1]], [hb[0], hb[1]], 'demo-weight', dur) : poly([[ha[0][0] - 16, ha[0][1]], [ha[0][0] + 16, ha[0][1]]], [[hb[0][0] - 16, hb[0][1]], [hb[0][0] + 16, hb[0][1]]], 'demo-weight', dur);
    if (kind === 'bar-shoulders') return poly([[a.N[0] - 16, a.N[1] - 2], [a.N[0] + 16, a.N[1] - 2]], [[b.N[0] - 16, b.N[1] - 2], [b.N[0] + 16, b.N[1] - 2]], 'demo-weight', dur);
    if (kind === 'band') return ha.length > 1 ? poly([ha[0], ha[1]], [hb[0], hb[1]], 'demo-band', dur) : poly([ha[0], [ha[0][0] + 60, ha[0][1]]], [hb[0], [hb[0][0] + 60, hb[0][1]]], 'demo-band', dur);
    if (kind === 'wheel') return `<circle class="demo-weight" r="5" cx="${ha[0][0]}" cy="${ha[0][1] + 5}">${anim('cx', ha[0][0], hb[0][0], dur)}${anim('cy', ha[0][1] + 5, hb[0][1] + 5, dur)}</circle>`;
    if (kind === 'sled') { const fa = a.legs[0][2], fb = b.legs[0][2]; return poly([[fa[0] + 4, fa[1] - 14], [fa[0] - 4, fa[1] + 10]], [[fb[0] + 4, fb[1] - 14], [fb[0] - 4, fb[1] + 10]], 'demo-weight', dur); }
    return '';
  }
  function propShapes(props) {
    return (props || []).map(prop => {
      if (prop === 'bench') return `<rect class="demo-prop" x="18" y="104" width="100" height="6" rx="3"/>`;
      if (prop === 'seat') return `<rect class="demo-prop" x="60" y="96" width="46" height="6" rx="3"/>`;
      return '';
    }).join('');
  }

  // The SVG of one demo. `still` draws only the first pose (reduced motion).
  function demoSVG(demo, { still = false, dur = 2.6 } = {}) {
    const d = DEMOS[demo.key]; if (!d) return '';
    const a = d.a, b = still ? d.a : d.b;
    const legs = a.legs.map((leg, i) => poly(leg, b.legs[i] || leg, 'demo-limb', dur)).join('');
    const arms = a.arms.map((arm, i) => poly(arm, b.arms[i] || arm, 'demo-limb', dur)).join('');
    const foot = a.foot ? poly(a.foot, b.foot || a.foot, 'demo-limb', dur) : '';
    return `<svg class="demo-figure" viewBox="0 0 200 140" role="img" aria-label="Demonstração animada: ${d.label}">` +
      `<line class="demo-floor" x1="6" y1="${F}" x2="194" y2="${F}"/>${propShapes(a.props)}` +
      legs + foot + poly(torso(a), torso(b), 'demo-torso', dur) + arms +
      `<circle class="demo-head" r="7" cx="${a.head[0]}" cy="${a.head[1]}">${anim('cx', a.head[0], b.head[0], dur)}${anim('cy', a.head[1], b.head[1], dur)}</circle>` +
      weightShapes(demo.weight, a, b, dur) + `</svg>`;
  }

  function demoHTML(exercise) {
    const demo = demoFor(exercise); if (!demo) return '';
    const still = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return `<figure class="demo">${demoSVG(demo, { still })}<figcaption>${still ? 'Posição inicial' : 'O movimento repete-se'} · ${demo.label}</figcaption></figure>`;
  }

  const api = { DEMOS, BY_ID, demoFor, demoSVG, demoHTML };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.TreinoDemos = api;
})();
