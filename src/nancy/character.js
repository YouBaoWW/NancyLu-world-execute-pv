/**
 * NancyLu / 契约 — procedural three-ink plates.
 * All outlines are authored Bezier paths. No image, traced bitmap, or font glyph
 * participates in the character silhouette. Motion is a pure function of t.
 * Coordinates below use the same 1,600-unit atelier for every pose.
 */

const PATHS = new Map();
const DEFAULT = { ink: '#080d15', white: '#f2f5f7', blue: '#48baff' };
const VIEWS = {
  bust: { x: -460, y: 40, w: 920, h: 1070 },
  paws: { x: -490, y: 40, w: 980, h: 1070 },
  reach: { x: -680, y: 40, w: 1310, h: 1070 },
  profile: { x: -455, y: 40, w: 910, h: 1070 },
  full: { x: -500, y: 40, w: 1000, h: 1530 },
  eye: { x: -265, y: 255, w: 530, h: 340 },
};

function path(d) {
  let value = PATHS.get(d);
  if (!value) { value = new Path2D(d); PATHS.set(d, value); }
  return value;
}

function shape(ctx, d, fill, stroke = null, width = 2) {
  const p = path(d);
  if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(p); }
}

function line(ctx, d, color, width = 2, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  shape(ctx, d, null, color, width); ctx.restore();
}

function oval(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
}

function dots(ctx, d, color, spacing = 15, opacity = .24) {
  ctx.save(); ctx.clip(path(d)); ctx.globalAlpha *= opacity;
  ctx.fillStyle = color;
  for (let y = 135; y < 1540; y += spacing) {
    for (let x = -560; x < 560; x += spacing) {
      ctx.beginPath(); ctx.arc(x + ((y / spacing | 0) % 2) * spacing / 2, y, 1.25, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function hairBack(ctx, p, t) {
  const drift = Math.sin(t * 1.05) * 8;
  ctx.save(); ctx.translate(drift, 0);
  // An asymmetric, wind-cut silhouette. The white hair is allowed to breathe
  // outside the shoulder rather than becoming a symmetrical helmet.
  shape(ctx, 'M -82 175 C -190 151 -256 226 -253 344 C -262 427 -354 427 -410 486 C -455 531 -447 594 -404 601 C -448 558 -387 543 -345 543 C -424 622 -420 707 -358 735 C -400 674 -338 642 -286 632 C -326 715 -303 775 -354 835 C -396 882 -400 952 -348 984 C -373 935 -325 915 -292 894 C -260 866 -247 814 -228 769 C -217 883 -237 993 -196 1084 C -189 1000 -158 942 -142 862 C -127 741 -134 633 -93 552 C -43 454 39 339 -5 249 Z', p.white, p.ink, 7);
  shape(ctx, 'M 87 179 C 184 155 244 211 247 319 C 251 418 280 431 317 486 C 358 547 328 612 286 640 C 329 579 272 559 244 526 C 264 596 231 662 266 724 C 310 793 347 809 337 877 C 327 834 277 842 251 816 C 257 886 307 929 284 1000 C 250 916 209 905 188 831 C 168 894 191 990 165 1086 C 149 1022 110 936 116 858 C 101 734 104 659 67 563 C 4 419 14 284 87 179 Z', p.ink, p.white, 3);
  // Silver strands with long, tapered negative cuts.
  shape(ctx, 'M -152 327 C -186 443 -327 501 -369 547 C -294 527 -189 474 -157 430 C -196 564 -315 619 -331 680 C -288 645 -199 613 -170 540 C -178 643 -246 695 -252 759 C -201 714 -158 683 -147 594 L -103 432 Z', p.ink);
  shape(ctx, 'M -126 575 C -140 699 -192 762 -190 843 C -153 787 -111 723 -105 640 Z', p.ink);
  shape(ctx, 'M -204 491 C -258 525 -310 536 -343 572 C -284 548 -251 552 -216 529 Z', p.blue);
  line(ctx, 'M -219 316 C -230 444 -351 478 -401 522 M -233 400 C -218 500 -306 581 -339 609 M -198 625 C -240 698 -277 716 -275 797 M -157 805 C -150 892 -182 953 -179 1005', p.ink, 2.2, .45);
  line(ctx, 'M 221 333 C 213 429 268 468 277 511 M 205 526 C 182 602 195 670 239 716 M 164 779 C 157 857 207 916 207 951', p.white, 2.2, .5);
  dots(ctx, 'M 139 255 C 224 299 210 466 268 521 C 260 620 204 692 232 813 L 154 759 L 87 447 Z', p.white, 16, .18);
  ctx.restore();
}

function tail(ctx, p, t, pose) {
  const w = Math.sin(t * 1.7) * 16;
  ctx.save(); ctx.translate(pose === 'paws' ? 15 : -5, pose === 'full' ? 0 : -245);
  shape(ctx, `M -115 1024 C -282 1050 -433 973 -432 853 C -430 757 -364 700 -387 ${660 + w} C -409 ${624 + w} -453 ${662 + w} -464 ${709 + w} C -496 641 -444 578 -391 605 C -322 638 -324 715 -351 788 C -404 922 -241 953 -116 944 Z`, p.white, p.ink, 6);
  shape(ctx, `M -384 ${605 + w * .1} C -339 631 -329 668 -341 714 C -362 737 -389 742 -407 722 C -383 700 -377 677 -387 ${660 + w} C -409 ${624 + w} -453 ${662 + w} -464 ${709 + w} C -493 648 -449 580 -398 601 Z`, p.ink);
  line(ctx, 'M -414 811 C -442 918 -296 1004 -170 994', p.blue, 3, .75);
  ctx.restore();
}

function legs(ctx, p) {
  shape(ctx, 'M -156 1032 C -182 1131 -179 1192 -158 1260 L -193 1420 C -207 1454 -253 1475 -243 1508 C -221 1536 -163 1544 -119 1515 C -83 1490 -94 1467 -99 1434 L -70 1250 L -9 1121 Z', p.ink, p.white, 3);
  shape(ctx, 'M 18 1078 C 18 1198 60 1260 91 1330 L 118 1463 C 113 1497 136 1521 177 1527 C 215 1535 263 1520 264 1501 C 263 1478 215 1478 200 1454 L 184 1301 C 177 1221 166 1136 151 1060 Z', p.ink, p.white, 3);
  shape(ctx, 'M -156 1068 C -156 1162 -129 1196 -124 1235 L -104 1152 L -84 1099 Z M 96 1124 C 94 1209 128 1264 138 1320 L 164 1360 L 149 1203 Z', p.white);
  line(ctx, 'M -165 1088 C -188 1152 -143 1203 -145 1258 L -174 1410 M 145 1111 L 151 1277 L 171 1434', p.blue, 4);
  line(ctx, 'M -198 1436 L -114 1451 M 122 1454 L 198 1434', p.blue, 8);
  line(ctx, 'M -205 1471 L -118 1486 M 137 1491 L 221 1491', p.white, 3, .7);
  shape(ctx, 'M -186 1425 L -126 1439 L -132 1464 L -195 1448 Z M 129 1445 L 184 1431 L 192 1454 L 134 1468 Z', p.ink, p.white, 2);
  line(ctx, 'M -157 1206 L -140 1232 M -163 1218 L -145 1243 M 134 1266 L 147 1291 M 132 1281 L 145 1306', p.white, 2, .6);
}

function torso(ctx, p, pose) {
  if (pose === 'full') legs(ctx, p);
  // Neck is a small white break inside the raised tech collar.
  shape(ctx, 'M -66 521 L -66 622 C -49 650 46 658 79 619 L 70 521 Z', p.white, p.ink, 4);
  shape(ctx, 'M -67 546 C -30 571 33 573 72 550 L 74 590 C 11 606 -36 595 -67 574 Z', p.ink);
  shape(ctx, 'M -92 580 L -11 617 L 86 576 L 99 631 L 173 662 C 224 700 210 786 180 855 L 153 951 C 195 1004 207 1084 171 1163 C 134 1195 88 1197 42 1182 L -13 1150 L -77 1184 C -126 1177 -180 1140 -186 1098 C -190 1017 -156 959 -156 910 L -185 754 C -215 699 -172 649 -98 632 Z', p.ink, p.white, 4);
  // Matte print planes, never a glossy anatomical highlight.
  shape(ctx, 'M -158 683 C -177 726 -151 783 -152 823 L -124 911 C -131 986 -143 1043 -103 1093 L -69 1126 L -39 1052 C -86 989 -69 933 -77 885 L -110 750 Z', p.white);
  shape(ctx, 'M 96 672 C 135 692 159 740 148 781 C 125 830 128 874 118 923 L 81 999 C 105 922 89 850 90 808 C 65 750 57 702 96 672 Z', p.white);
  // White planes are screened so the suit remains predominantly near-black.
  ctx.save(); ctx.globalAlpha *= .85;
  shape(ctx, 'M -153 693 C -162 756 -123 849 -123 918 L -85 1009 L -97 1071 L -70 1107 L -53 1053 C -92 981 -71 935 -83 882 L -116 746 Z M 101 690 C 139 721 148 756 131 794 L 108 916 L 86 964 C 92 899 78 858 78 806 C 61 754 71 709 101 690 Z', p.ink);
  ctx.restore();
  shape(ctx, 'M -89 604 L -18 639 L 1 702 L 27 639 L 88 601 L 82 646 L 27 680 L 14 733 L -4 733 L -30 673 L -93 646 Z', p.white);
  shape(ctx, 'M -83 611 L -26 641 L -8 685 L -5 642 L -85 600 Z M 81 611 L 28 646 L 16 678 L 23 632 L 83 591 Z', p.ink);
  line(ctx, 'M -93 593 L -96 638 L -146 667 M 88 588 L 95 635 L 162 666', p.blue, 5);
  line(ctx, 'M 0 690 C 10 778 32 864 13 943 L 24 1018 L 4 1129', p.blue, 4);
  line(ctx, 'M -144 669 L -111 741 L -111 813 M 150 678 L 113 752 L 120 824', p.blue, 4);
  line(ctx, 'M -154 962 L -99 1014 L -83 1074 M 149 959 L 90 1016 L 72 1092', p.blue, 3.5);
  // Zipper pull and dense, deliberate mechanical hardware.
  shape(ctx, 'M -5 697 L 16 697 L 18 730 L -3 730 Z', p.ink, p.white, 2);
  line(ctx, 'M 2 706 L 11 706 L 11 720 L 2 720 Z', p.white, 2);
  shape(ctx, 'M -186 685 L -152 667 L -122 719 L -149 741 Z', p.white);
  shape(ctx, 'M -174 687 L -155 679 L -138 713 L -150 721 Z', p.ink);
  shape(ctx, 'M 144 659 L 181 671 L 171 710 L 136 695 Z', p.white);
  shape(ctx, 'M 150 670 L 169 677 L 164 695 L 146 688 Z', p.ink);
  shape(ctx, 'M -177 1036 C -78 1054 73 1051 170 1024 L 183 1065 C 65 1091 -79 1090 -180 1076 Z', p.ink, p.white, 3);
  shape(ctx, 'M -17 1042 L 43 1041 L 46 1080 L -17 1081 Z', p.white);
  shape(ctx, 'M -9 1050 L 33 1050 L 35 1071 L -9 1072 Z', p.ink);
  line(ctx, 'M -2 1060 L 24 1060', p.blue, 3);
  oval(ctx, -141, 1002, 22, 21, p.white, -.2);
  oval(ctx, -141, 1002, 15, 14, p.ink, -.2);
  line(ctx, 'M -153 1002 L -132 1002 M -141 990 L -141 1013', p.white, 2);
  oval(ctx, -113, 953, 16, 15, p.white, -.2);
  oval(ctx, -113, 953, 10, 9, p.ink, -.2);
  dots(ctx, 'M 62 713 C 152 718 137 843 114 951 L 65 1015 L 28 945 L 43 793 Z', p.white, 13, .24);
  line(ctx, 'M -134 916 L -123 929 M -132 927 L -121 940 M 110 870 L 120 857 M 108 883 L 118 870 M 58 1129 L 80 1134 M 57 1137 L 74 1141', p.white, 2, .5);
}

function cuff(ctx, p, x, y, rotation, side = 'dark') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  shape(ctx, 'M -54 -23 L 51 -23 L 53 21 L -53 21 Z', p.ink, p.white, 3);
  line(ctx, 'M -51 -13 L 48 -13 M -51 12 L 48 12', p.blue, 3);
  oval(ctx, 17, -1, 10, 10, p.white);
  oval(ctx, 17, -1, 5, 5, side === 'blue' ? p.blue : p.ink);
  ctx.restore();
}

function paw(ctx, p, x, y, rotation, blue = false, mirror = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(mirror ? -1 : 1, 1);
  const color = blue ? p.blue : p.ink;
  // Curled human fingers: the cat pose comes from the wrist and gesture.
  shape(ctx, 'M -36 60 C -59 28 -64 -17 -47 -43 C -36 -60 -19 -56 -13 -40 C -18 -65 -4 -80 9 -70 C 21 -60 18 -40 20 -30 C 23 -58 42 -61 48 -43 C 52 -30 47 -10 50 3 C 64 -13 79 -8 77 8 C 75 37 48 68 28 78 L -18 89 Z', color, p.white, blue ? 2.5 : 3);
  shape(ctx, 'M -35 58 C -43 20 -24 9 -9 24 C -3 32 -7 51 9 52 C 19 53 26 37 24 27 C 45 24 57 34 46 50 L 21 74 L -17 83 Z', p.ink);
  if (!blue) {
    shape(ctx, 'M -40 -35 C -37 -47 -27 -47 -22 -37 L -21 -8 L -31 -4 Z M 0 -56 L 7 -55 L 8 -20 L -1 -18 Z', p.white);
  }
  line(ctx, 'M -14 -31 L -9 -3 M 20 -28 L 23 0 M -39 4 C -28 1 -21 7 -18 19 M 24 26 C 25 8 38 8 48 11', blue ? p.ink : p.blue, 2.8);
  line(ctx, 'M -32 70 L 16 63 M -28 78 L 9 72', p.white, 2, .7);
  ctx.restore();
}

function arms(ctx, p, pose, t) {
  const breath = Math.sin(t * 1.9) * 3;
  if (pose === 'paws') {
    shape(ctx, 'M -160 663 C -204 639 -225 680 -249 738 L -269 759 L -281 617 L -225 595 C -212 634 -206 669 -192 696 L -188 779 C -211 827 -249 852 -285 825 C -326 792 -322 693 -330 638 L -321 580 L -246 556 Z', p.ink, p.white, 4);
    shape(ctx, 'M 156 663 C 199 640 230 679 254 737 L 277 756 L 286 616 L 230 594 C 216 632 209 670 195 698 L 194 779 C 216 826 252 851 288 823 C 327 789 327 695 334 639 L 325 582 L 249 558 Z', p.ink, p.white, 4);
    line(ctx, 'M -191 680 L -229 778 L -284 798 L -303 637 M 195 681 L 235 781 L 287 799 L 307 638', p.blue, 4);
    cuff(ctx, p, -285, 597 + breath, -.2, 'blue');
    cuff(ctx, p, 288, 597 - breath, .2);
    paw(ctx, p, -276, 527 + breath, -.35, true);
    paw(ctx, p, 279, 527 - breath, .35, false, true);
  } else if (pose === 'reach') {
    shape(ctx, 'M -161 661 C -207 644 -257 669 -304 698 L -450 713 L -453 787 C -363 809 -290 791 -226 779 L -167 754 Z', p.ink, p.white, 4);
    line(ctx, 'M -185 681 L -301 748 L -442 756', p.blue, 5);
    cuff(ctx, p, -443, 749, Math.PI / 2, 'blue');
    ctx.save(); ctx.translate(-450, 746 + breath); ctx.rotate(-.13);
    shape(ctx, 'M -10 -40 C -29 -50 -45 -56 -66 -64 L -106 -117 C -116 -132 -130 -127 -125 -111 L -98 -66 L -167 -92 C -188 -101 -198 -87 -178 -77 L -119 -45 L -197 -48 C -218 -49 -222 -34 -199 -31 L -122 -14 L -179 4 C -198 9 -194 24 -173 20 L -91 11 C -115 34 -107 51 -90 39 L -44 8 L -10 14 Z', p.blue, p.ink, 3);
    line(ctx, 'M -102 -65 L -78 -45 L -63 -12 M -117 -43 L -91 -34 M -115 -13 L -88 -18', p.ink, 3);
    ctx.restore();
    shape(ctx, 'M 157 665 C 216 652 232 708 245 763 L 264 858 C 260 901 219 925 188 893 L 120 778 L 151 733 L 203 822 L 187 741 Z', p.ink, p.white, 4);
    line(ctx, 'M 188 684 L 209 767 L 228 861 L 204 875 L 143 778', p.blue, 4);
    cuff(ctx, p, 134, 766, -.75);
    paw(ctx, p, 102, 702, -.65, false, true);
  } else {
    shape(ctx, 'M -163 663 C -216 641 -243 683 -254 756 L -273 908 C -282 962 -256 986 -228 964 L -192 848 L -164 763 Z', p.ink, p.white, 4);
    shape(ctx, 'M 156 661 C 208 641 238 690 246 751 L 264 904 C 272 954 246 982 219 958 L 192 845 L 163 761 Z', p.ink, p.white, 4);
    line(ctx, 'M -203 684 L -226 767 L -244 920 M 199 683 L 218 765 L 241 920', p.blue, 4);
    cuff(ctx, p, -244, 914, .12, 'blue');
    cuff(ctx, p, 239, 912, -.12);
    // Relaxed hands have cropped, tapered fingers rather than ball ends.
    shape(ctx, 'M -270 932 L -223 935 L -222 974 C -215 995 -212 1026 -223 1028 L -236 989 L -235 1040 C -239 1055 -248 1047 -248 1036 L -250 1001 L -258 1034 C -263 1048 -272 1040 -268 1027 L -263 991 C -284 994 -289 975 -280 961 Z', p.blue, p.ink, 3);
    shape(ctx, 'M 216 929 L 263 927 L 274 960 C 284 974 280 991 267 987 L 271 1023 C 273 1039 264 1046 258 1033 L 250 1001 L 248 1036 C 247 1049 238 1052 234 1038 L 232 989 L 222 1027 C 212 1029 210 1005 218 977 Z', p.ink, p.white, 2);
    line(ctx, 'M -263 954 L -236 960 M 230 954 L 258 949', p.white, 2, .6);
  }
}

function ears(ctx, p, t, pose) {
  const alert = pose === 'paws' ? .018 * Math.sin(t * 2.2) : .01 * Math.sin(t * 1.3);
  ctx.save(); ctx.rotate(alert);
  shape(ctx, 'M -177 244 C -203 181 -218 91 -197 35 C -150 47 -94 101 -61 177 Z', p.white, p.ink, 7);
  shape(ctx, 'M -168 204 C -181 154 -189 102 -183 76 C -147 96 -123 129 -107 166 Z', p.blue);
  shape(ctx, 'M -169 154 L -157 138 L -153 164 L -134 155 L -141 182 L -123 181 L -150 211 Z', p.white);
  shape(ctx, 'M 62 179 C 99 100 160 39 207 18 C 226 88 216 167 184 231 Z', p.ink, p.white, 3.5);
  shape(ctx, 'M 115 170 C 144 122 167 91 188 74 C 195 114 184 162 171 193 Z', p.blue);
  shape(ctx, 'M 144 159 L 161 148 L 159 173 L 179 164 L 164 189 L 175 192 L 148 207 L 133 194 Z', p.white);
  line(ctx, 'M -190 54 C -191 101 -183 156 -179 178 M 205 37 C 204 82 197 122 188 145', p.white, 2.2, .6);
  ctx.restore();
}

function face(ctx, p, t, pose) {
  shape(ctx, 'M -163 277 C -191 331 -179 405 -154 465 C -133 513 -75 559 -10 570 C 55 562 116 531 151 469 C 179 420 183 344 149 288 C 112 227 -105 223 -163 277 Z', p.white, p.ink, 5);
  // Hard-edged shadow plane in the second ink keeps the face a print.
  shape(ctx, 'M 128 289 C 157 331 158 391 139 445 C 117 507 76 531 15 550 C 67 549 120 527 151 470 C 177 417 182 344 149 289 Z', p.ink);
  line(ctx, 'M -159 390 C -169 418 -162 441 -150 451 M 144 388 C 158 410 152 435 142 448', p.ink, 2.2, .6);
  if (pose === 'paws') {
    // Playful half lids, copied neither from a font nor from an image.
    shape(ctx, 'M -133 408 C -99 424 -73 420 -43 402 C -61 436 -111 442 -139 420 L -150 405 L -135 410 L -143 397 Z', p.ink);
    shape(ctx, 'M 43 403 C 75 420 104 421 132 405 L 146 394 L 138 411 L 151 405 L 137 424 C 99 445 61 434 43 403 Z', p.ink);
    shape(ctx, 'M -119 419 C -103 431 -86 429 -73 422 L -77 444 C -95 453 -114 442 -119 419 Z M 72 423 C 89 432 109 430 121 419 L 117 442 C 100 452 80 446 72 423 Z', p.blue);
    line(ctx, 'M -114 431 L -86 437 M 84 436 L 110 430', p.white, 2);
  } else {
    // The upper lid defines the eye, with the iris partially under it.
    shape(ctx, 'M -143 404 C -113 373 -69 374 -38 401 C -69 429 -110 439 -139 421 L -155 397 L -141 405 L -151 386 L -132 398 Z', p.ink);
    shape(ctx, 'M -131 407 C -107 390 -70 391 -48 404 C -73 427 -107 435 -128 419 Z', p.white);
    oval(ctx, -89, 410, 22, 30, p.blue, -.12);
    shape(ctx, 'M -111 397 C -99 388 -79 389 -68 398 L -71 413 C -84 400 -100 400 -110 412 Z', p.ink);
    oval(ctx, -89, 414, 8, 20, p.ink, -.1);
    oval(ctx, -96, 402, 6, 8, p.white);
    oval(ctx, -78, 420, 3, 3, p.white);
    shape(ctx, 'M 37 402 C 69 373 112 375 141 400 L 154 383 L 146 402 L 159 394 L 142 419 C 116 437 72 432 37 402 Z', p.ink);
    shape(ctx, 'M 48 404 C 71 389 109 390 131 405 L 128 418 C 106 432 73 425 48 404 Z', p.white);
    oval(ctx, 89, 409, 22, 29, p.blue, .12);
    shape(ctx, 'M 68 398 C 82 388 100 390 110 397 L 111 412 C 96 401 83 401 70 412 Z', p.ink);
    oval(ctx, 89, 413, 8, 20, p.ink, .1);
    oval(ctx, 82, 401, 6, 8, p.white);
    oval(ctx, 101, 419, 3, 3, p.white);
    line(ctx, 'M -129 442 C -103 449 -76 446 -58 435 M 57 436 C 78 448 105 448 126 438', p.ink, 1.8, .7);
  }
  line(ctx, 'M -128 362 C -104 349 -76 348 -55 355 M 57 355 C 82 345 105 348 126 358', p.ink, 4);
  line(ctx, 'M 1 428 L -7 465 L 4 467', p.ink, 2.8);
  if (pose === 'paws') {
    shape(ctx, 'M -27 496 C -8 510 13 510 34 490 C 31 520 13 537 -5 533 C -16 528 -23 515 -27 496 Z', p.ink);
    shape(ctx, 'M -10 523 C 3 515 17 519 23 523 C 11 537 -1 538 -10 523 Z', p.blue);
    shape(ctx, 'M -17 501 L -7 511 L -2 504 Z', p.white);
  } else {
    line(ctx, 'M -26 502 C -5 511 19 507 36 495', p.ink, 3.5);
    line(ctx, 'M 8 520 L 24 516', p.ink, 2, .5);
  }
  // Engraved cheeks in place of a fourth blush ink.
  line(ctx, 'M -131 468 L -125 479 M -119 468 L -113 478 M -107 466 L -102 474 M 104 466 L 99 476 M 116 467 L 111 478 M 128 465 L 123 477', p.blue, 2.3, .55);
}

function hairFront(ctx, p, t) {
  // The direction of the split is an intentional identifying feature.
  shape(ctx, 'M 1 166 C -62 128 -171 149 -203 221 C -232 283 -204 361 -184 406 L -194 454 L -155 425 C -176 388 -173 331 -153 299 C -156 345 -138 380 -104 401 C -125 353 -119 327 -105 301 C -97 352 -67 379 -37 387 C -58 355 -59 324 -56 298 C -31 340 -6 360 29 362 C -2 333 -13 302 -14 266 C 11 308 43 330 79 328 C 43 302 31 263 25 225 C 78 268 98 297 110 350 C 130 324 136 294 121 256 C 94 192 41 164 1 166 Z', p.white, p.ink, 5);
  shape(ctx, 'M 15 164 C 63 136 128 146 174 181 C 219 219 235 266 222 331 C 238 374 223 405 193 429 L 188 472 C 175 443 155 426 143 397 C 165 344 153 291 130 269 C 144 313 134 343 118 364 C 121 317 103 287 75 263 C 104 303 88 330 78 348 C 62 323 55 292 40 267 C 45 304 40 328 28 343 C 9 310 -2 276 -13 251 C -8 215 2 181 15 164 Z', p.ink, p.white, 3);
  // Wind whiskers break the silhouette with crisp tapered strokes.
  shape(ctx, 'M -187 226 C -237 208 -272 222 -293 247 C -247 225 -221 239 -204 255 Z M -199 302 C -259 313 -277 361 -267 393 C -267 346 -230 333 -199 327 Z M -185 406 C -192 471 -145 540 -176 596 C -154 580 -137 551 -143 517 C -163 467 -166 439 -158 412 Z', p.white);
  shape(ctx, 'M 161 187 C 216 178 250 208 270 244 C 237 221 213 214 187 221 Z M 210 298 C 263 314 278 354 269 380 C 266 344 238 333 214 332 Z M 182 422 C 185 476 232 497 230 539 C 229 569 207 582 191 588 C 221 554 196 532 177 506 C 160 481 157 455 165 432 Z', p.ink);
  // A tall loose forelock, an especially recognisable white hook.
  shape(ctx, 'M -27 175 C -14 129 28 129 24 97 C 20 69 -20 69 -33 91 C -20 42 42 48 55 89 C 68 131 26 146 11 180 Z', p.white, p.ink, 3);
  line(ctx, 'M -173 219 C -179 265 -155 312 -144 333 M -126 196 C -149 242 -123 285 -109 301 M -92 181 C -114 230 -90 293 -74 315 M -56 183 C -74 226 -46 282 -31 301 M -26 198 C -40 238 -16 278 0 298', p.ink, 2, .58);
  line(ctx, 'M 61 184 C 113 201 143 245 155 287 M 105 180 C 170 220 185 281 179 333 M 182 237 C 210 272 209 320 197 351', p.white, 2, .54);
  // A small skull barrette, constructed as real negative-space holes.
  ctx.save(); ctx.translate(163, 299); ctx.rotate(.16);
  shape(ctx, 'M -30 -30 C -47 -22 -45 15 -29 23 L -24 40 L -13 34 L -2 42 L 9 34 L 20 40 L 25 23 C 43 13 45 -22 28 -30 C 13 -40 -15 -41 -30 -30 Z', p.white, p.ink, 3);
  shape(ctx, 'M -30 -5 L -9 -14 L -5 9 L -26 12 Z M 8 -14 L 29 -6 L 25 12 L 5 9 Z M -5 16 L 4 16 L 8 25 L -8 25 Z', p.ink);
  line(ctx, 'M -16 24 L -15 34 M -3 27 L -3 37 M 10 25 L 10 35', p.ink, 2);
  ctx.restore();
}

function profileHead(ctx, p, t) {
  shape(ctx, 'M -150 298 C -175 345 -157 431 -128 474 C -115 506 -84 542 -33 554 L 76 543 L 99 515 L 141 500 L 115 477 L 138 451 L 176 435 L 147 407 C 146 361 112 305 77 282 Z', p.white, p.ink, 5);
  shape(ctx, 'M 65 369 C 93 365 116 379 133 397 L 110 399 C 92 391 73 394 53 401 Z', p.ink);
  shape(ctx, 'M 68 391 L 113 396 C 107 420 92 433 77 429 Z', p.blue);
  shape(ctx, 'M 87 392 L 100 394 L 96 422 L 88 422 Z', p.ink);
  line(ctx, 'M 67 354 C 85 347 105 354 119 362 M 113 479 L 137 481 M 103 495 L 120 497', p.ink, 3);
  shape(ctx, 'M -27 188 C 69 142 153 211 170 292 C 153 338 153 355 139 385 C 133 331 102 314 75 304 L 95 354 C 53 339 27 309 11 281 C 9 331 43 381 27 426 C 18 446 -1 457 -14 469 C 8 432 -22 413 -49 394 C -17 453 -32 500 -54 528 C -49 457 -100 437 -112 384 C -131 323 -116 255 -83 213 Z', p.white, p.ink, 5);
  shape(ctx, 'M -23 189 C 64 150 139 196 171 261 L 175 300 L 149 340 C 151 285 111 232 68 219 C 92 250 102 275 106 302 C 49 281 14 246 -23 228 Z', p.ink);
  line(ctx, 'M -85 244 C -91 303 -49 347 -47 384 M -56 218 C -55 272 -13 318 0 344 M 40 203 C 85 216 119 251 135 280', p.ink, 2.2, .6);
  ctx.save(); ctx.translate(-124, 368); ctx.rotate(.3);
  shape(ctx, 'M -10 -5 C -34 -32 -54 -8 -44 15 C -39 29 -16 40 -4 22 Z', p.white, p.ink, 3);
  line(ctx, 'M -33 0 C -25 -4 -17 6 -16 18', p.ink, 2);
  ctx.restore();
}

function drawFigure(ctx, { p, t, pose }) {
  const b = Math.sin(t * 1.65) * 2.2;
  ctx.save(); ctx.translate(0, b);
  tail(ctx, p, t, pose);
  hairBack(ctx, p, t);
  torso(ctx, p, pose);
  arms(ctx, p, pose, t);
  ctx.save(); ctx.rotate((pose === 'paws' ? -.035 : -.018) + Math.sin(t * .65) * .006);
  ears(ctx, p, t, pose);
  if (pose === 'profile') profileHead(ctx, p, t);
  else { face(ctx, p, t, pose); hairFront(ctx, p, t); }
  ctx.restore();
  ctx.restore();
}

/**
 * Draw a NancyLu plate. x/y = centre/top of the selected pose's viewbox.
 * No state advances between calls: rendering t in reverse gives the same plate.
 * Height is the final viewbox height; caller can crop/clip it as a print block.
 */
export function drawNancy(ctx, opts = {}) {
  const {
    x = 0, y = 0, height = 1000, t = 0, pose = 'bust',
    palette = DEFAULT, alpha = 1, mode = 'solid',
  } = opts;
  const p = { ...DEFAULT, ...palette };
  const view = VIEWS[pose] || VIEWS.bust;
  const scale = height / view.h;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.translate(-(view.x + view.w / 2), -view.y);
  ctx.beginPath(); ctx.rect(view.x, view.y, view.w, view.h); ctx.clip();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  drawFigure(ctx, { p, t, pose });
  if (mode === 'engraved') {
    // Thin scan cuts are native geometry and remain sharp at export scale.
    ctx.save(); ctx.globalAlpha *= .16; ctx.strokeStyle = p.ink; ctx.lineWidth = 1.2;
    for (let yy = view.y; yy < view.y + view.h; yy += 9) {
      ctx.beginPath(); ctx.moveTo(view.x, yy); ctx.lineTo(view.x + view.w, yy); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  return { width: view.w * scale, height, left: x - view.w * scale / 2, top: y };
}

/** Floating companion; x/y is its centre, size is its approximate full width. */
export function drawMouse(ctx, opts = {}) {
  const { x = 0, y = 0, size = 180, t = 0, palette = DEFAULT } = opts;
  const p = { ...DEFAULT, ...palette };
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2.1) * size * .025); ctx.scale(size / 240, size / 240);
  ctx.rotate(Math.sin(t * .9) * .045); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  shape(ctx, 'M -71 65 C -130 88 -152 61 -140 26 C -134 5 -112 0 -105 -24', null, p.blue, 5);
  shape(ctx, 'M -76 -40 C -121 -74 -122 -19 -101 5 L -70 14 Z M 74 -41 C 117 -75 122 -18 101 4 L 72 16 Z', p.white, p.ink, 5);
  shape(ctx, 'M -82 -32 C -109 -50 -110 -18 -98 -3 L -81 3 Z M 82 -33 C 108 -51 111 -18 99 -3 L 82 3 Z', p.blue);
  shape(ctx, 'M -69 -51 L -91 -91 L -55 -78 L -34 -55 Z M 42 -54 L 70 -88 L 74 -46 Z', p.ink, p.white, 2);
  shape(ctx, 'M -58 -61 C -89 -58 -104 -20 -94 19 C -83 55 -51 73 -1 75 C 53 75 86 55 95 21 C 104 -18 86 -53 60 -61 Z', p.white, p.ink, 5);
  shape(ctx, 'M -89 -23 L 80 -49 L 87 -6 L -82 23 Z', p.ink, p.blue, 3);
  shape(ctx, 'M -73 -15 L 67 -36 L 70 -18 L -70 6 Z', p.blue);
  line(ctx, 'M -48 -8 L -35 -3 L -46 7 M 37 -22 L 23 -11 L 38 -7', p.ink, 5);
  shape(ctx, 'M -27 65 L -38 107 C -18 120 20 122 42 109 L 30 68 Z', p.ink, p.white, 3);
  shape(ctx, 'M -20 83 L 20 83 L 24 102 L -24 102 Z', p.blue);
  oval(ctx, -75, 46, 22, 26, p.ink, -.5); oval(ctx, 75, 45, 22, 26, p.ink, .5);
  line(ctx, 'M -89 43 L -66 54 M 66 54 L 89 43', p.blue, 3);
  line(ctx, 'M -6 37 L 0 43 L 7 36 M 0 43 L 0 50', p.ink, 2.8);
  ctx.restore();
}

export const nancyViewboxes = VIEWS;
