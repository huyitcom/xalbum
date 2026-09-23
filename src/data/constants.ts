import { AlbumPage, PosterSettings, TemplateDefinition, TemplateId, TextConfig } from '../types';

export const SAMPLE_WEDDING_PHOTOS = [
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
];

export const BASIC_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'basic-full-bleed',
    name: 'Mẫu số 1',
    description: '1 ảnh duy nhất trải rộng toàn bộ trang đôi',
    slotCount: 1,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-preserve-ratio-2',
    name: 'Mẫu số 2',
    description: '2 ảnh nguyên tỷ lệ gốc (1 ngang trái, 1 dọc phải) có khoảng cách lề thoáng',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-spread-2-vertical',
    name: 'Mẫu số 3',
    description: '2 ảnh dọc đối xứng chia đều giữa trang trái và trang phải',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-left-feature-2right',
    name: 'Mẫu số 4',
    description: '1 ảnh lớn trang trọng bên trái, 2 ảnh ngang xếp chồng bên phải',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-right-feature-2left',
    name: 'Mẫu số 5',
    description: '2 ảnh ngang xếp chồng bên trái, 1 ảnh lớn trang trọng bên phải',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-four-grid',
    name: 'Mẫu số 6',
    description: 'Lưới 4 ảnh đều nhau cân bằng (2 hàng, 2 cột)',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-panorama-top',
    name: 'Mẫu số 7',
    description: '1 ảnh panorama rộng bên trên, 3 ảnh bên dưới (1 ảnh trái, 2 ảnh ngang phải)',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-skewed-grid',
    name: 'Mẫu số 8',
    description: 'Lưới 4 ảnh so le (hàng trên trái rộng phải hẹp, hàng dưới trái hẹp phải rộng)',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-stack-right-3',
    name: 'Mẫu số 9',
    description: '1 ảnh lớn bên trái, 3 ảnh ngang xếp tầng bên phải',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-story-5',
    name: 'Mẫu số 10',
    description: '1 ảnh ngang panorama phía trên, 4 ảnh đứng xếp hàng ngang phía dưới',
    slotCount: 5,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-stack-left-3',
    name: 'Mẫu số 11',
    description: '3 ảnh ngang xếp tầng bên trái, 1 ảnh lớn bên phải',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-left-2split-feature',
    name: 'Mẫu số 12',
    description: '2 ảnh ngang bên trái, 1 ảnh lớn tràn viền bên phải',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-unequal-split-2',
    name: 'Mẫu số 13',
    description: '2 ảnh dọc chia tỷ lệ lệch 40% - 60%',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-trio-left',
    name: 'Mẫu số 14',
    description: '1 ảnh đứng bên trái, 2 ảnh ngang bên phải (tỷ lệ 50-50)',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-main-left-portrait',
    name: 'Mẫu số 15',
    description: '1 ảnh lớn chính bên trái (65%), 1 ảnh phụ đứng bên phải (35%)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-center-landscape-pair',
    name: 'Mẫu số 16',
    description: '2 ảnh ngang đối xứng giữa hai trang kèm viền trắng tinh tế',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-portrait-two-right',
    name: 'Mẫu số 17',
    description: '1 ảnh lớn bên trái, 2 ảnh đứng song song bên phải',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-four-vertical-columns',
    name: 'Mẫu số 18',
    description: '4 ảnh đứng trải đều qua 2 trang (mỗi bên 2 ảnh đứng)',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-four-asymmetric',
    name: 'Mẫu số 19',
    description: '3 ảnh nghệ thuật bên trái (2 nhỏ trên, 1 ngang dưới), 1 ảnh đứng bên phải cân xứng',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-mosaic-story',
    name: 'Mẫu số 20',
    description: 'Trang trái 2 ảnh (ngang trên, vuông dưới), trang phải 3 ảnh ngang xếp tầng',
    slotCount: 5,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-left-feature-right-2vert',
    name: 'Mẫu số 21',
    description: '1 ảnh lớn bên trái, 2 ảnh ngang lớn bên phải',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-left-primary-right-secondary',
    name: 'Mẫu số 22',
    description: '1 ảnh lớn chính bên trái (55%), 1 ảnh phụ nhỏ hơn đặt giữa trang phải (45%)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'basic',
  },
  {
    id: 'basic-left-primary-right-mosaic',
    name: 'Mẫu số 23',
    description: '1 ảnh lớn bên trái (50%), 4 ảnh ghép lưới 2x2 bên phải (50%)',
    slotCount: 5,
    aspectRatio: '50:35',
    category: 'basic',
  },
];

export const BG_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI2ZiYTFiNyIvPgogIDxwb2x5Z29uIHBvaW50cz0iMCwyMDAgODAwLDQwMCA4MDAsODAwIDAsODAwIiBmaWxsPSIjZDI2YzhiIi8+Cjwvc3ZnPg==';
export const OVERLAY_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDwhLS0gVGhlIG1hc2sgY3V0cyBvdXQgYSB0cmFuc3BhcmVudCBob2xlIGluIHRoZSBtaWRkbGUgb2Ygb3VyIG9wYXF1ZSBTVkcgLS0+CiAgICA8bWFzayBpZD0iaG9sZSI+CiAgICAgIDwhLS0gRXZlcnl0aGluZyBpcyB3aGl0ZSAob3BhcXVlKSAtLT4KICAgICAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IndoaXRlIiAvPgogICAgICA8IS0tIEV4Y2VwdCB0aGUgaG9sZSB3aGljaCBpcyBibGFjayAodHJhbnNwYXJlbnQpIC0tPgogICAgICA8IS0tIFRpbHRlZCAzIGRlZ3JlZXMgcmlnaHQgLS0+CiAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQwMCwgMzgwKSByb3RhdGUoMykgdHJhbnNsYXRlKC00MDAsIC0zODApIj4KICAgICAgICA8cmVjdCB4PSIyMDAiIHk9IjEwMCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSI1MjAiIGZpbGw9ImJsYWNrIiAvPgogICAgICA8L2c+CiAgICA8L21hc2s+CiAgICAKICAgIDxwYXR0ZXJuIGlkPSJkb3RzIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIzIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjYiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgCiAgPCEtLSBUaGUgbWFpbiBiYWNrZ3JvdW5kIHdpdGggdGhlIGhvbGUgY3V0IG91dCAtLT4KICA8ZyBtYXNrPSJ1cmwoI2hvbGUpIj4KICAgIDwhLS0gUGluayBCYWNrZ3JvdW5kIC0tPgogICAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiNmNGE1YjkiIC8+CiAgICA8cG9seWdvbiBwb2ludHM9IjAsNDAwIDgwMCw1NTAgODAwLDgwMCAwLDgwMCIgZmlsbD0iI2M0NjQ4NyIgLz4KICAgIAogICAgPCEtLSBUaGUgd2hpdGUgc2NhbGxvcGVkIGZyYW1lIChsYXJnZXIgdGhhbiB0aGUgaG9sZSkgLS0+CiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MDAsIDM4MCkgcm90YXRlKDMpIHRyYW5zbGF0ZSgtNDAwLCAtMzgwKSI+CiAgICAgIDxyZWN0IHg9IjE4MCIgeT0iODAiIHdpZHRoPSI0NDAiIGhlaWdodD0iNTYwIiByeD0iMTUiIGZpbGw9IndoaXRlIiAvPgogICAgICA8IS0tIElubmVyIGRhc2hlZCBzdHJva2UgZm9yIGRlY29yYXRpb24gLS0+CiAgICAgIDxyZWN0IHg9IjE5NSIgeT0iOTUiIHdpZHRoPSI0MTAiIGhlaWdodD0iNTMwIiByeD0iNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjEwIDEwIi8+CiAgICA8L2c+CiAgPC9nPgogIAogIDwhLS0gVGFwZXMgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNjAwLCAxMDApIHJvdGF0ZSgtMTApIj4KICAgIDxyZWN0IHg9Ii02MCIgeT0iLTIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiByeD0iNSIgZmlsbD0iI2ZmYjZjMSIgLz4KICAgIDxyZWN0IHg9Ii02MCIgeT0iLTIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiByeD0iNSIgZmlsbD0idXJsKCNkb3RzKSIgLz4KICA8L2c+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTgwLCA2ODApIHJvdGF0ZSgtNSkiPgogICAgPHJlY3QgeD0iLTYwIiB5PSItMjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSIjZmZiNmMxIiAvPgogICAgPHJlY3QgeD0iLTYwIiB5PSItMjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSJ1cmwoI2RvdHMpIiAvPgogIDwvZz4KICAKICA8IS0tIEZsb3dlcnMgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTQwLCAyNTApIj4KICAgIDxjaXJjbGUgY3g9IjAiIGN5PSItMjAiIHI9IjI1IiBmaWxsPSIjZGNlZGMxIiAvPgogICAgPGNpcmNsZSBjeD0iMjAiIGN5PSIwIiByPSIyNSIgZmlsbD0iI2RjZWRjMSIgLz4KICAgIDxjaXJjbGUgY3g9IjAiIGN5PSIyMCIgcj0iMjUiIGZpbGw9IiNkY2VkYzEiIC8+CiAgICA8Y2lyY2xlIGN4PSItMjAiIGN5PSIwIiByPSIyNSIgZmlsbD0iI2RjZWRjMSIgLz4KICAgIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIxOCIgZmlsbD0iI2ZmYjZjMSIgLz4KICAgIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSI4IiBmaWxsPSIjZmZmIiAvPgogIDwvZz4KICAKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg2ODAsIDM2MCkiPgogICAgPGNpcmNsZSBjeD0iMCIgY3k9Ii0yMCIgcj0iMjUiIGZpbGw9IiNkY2VkYzEiIC8+CiAgICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjAiIHI9IjI1IiBmaWxsPSIjZGNlZGMxIiAvPgogICAgPGNpcmNsZSBjeD0iMCIgY3k9IjIwIiByPSIyNSIgZmlsbD0iI2RjZWRjMSIgLz4KICAgIDxjaXJjbGUgY3g9Ii0yMCIgY3k9IjAiIHI9IjI1IiBmaWxsPSIjZGNlZGMxIiAvPgogICAgPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjE4IiBmaWxsPSIjZmZiNmMxIiAvPgogICAgPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjgiIGZpbGw9IiNmZmYiIC8+CiAgPC9nPgogIAogIDwhLS0gVGV4dCBSaWJib24gLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDAwLCA3MjApIHJvdGF0ZSgtMikiPgogICAgPHBhdGggZD0iTS0yMjAsLTM1IFEwLC00NSAyMjAsLTM1IEwyMzAsMjUgUTAsMzUgLTIyMCwyNSBaIiBmaWxsPSJ3aGl0ZSIgLz4KICAgIDx0ZXh0IHg9IjAiIHk9IjgiIGZvbnQtZmFtaWx5PSJjdXJzaXZlLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmaWxsPSIjNWMzYTQxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SGFwcHkgRWFzdGVyPC90ZXh0PgogIDwvZz4KPC9zdmc+';

export const VIP_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'overlay-lay01-01-02',
    name: 'Layout Đôi 01 - 02',
    description: 'Layout đôi photobook trang 1-2 (Trang trái nghệ thuật trang nhã, trang phải 1 ảnh chân dung/vuông)',
    slotCount: 1,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/01-02.png',
    slotsCoordinates: [
      {
        x: 64.6,  // Trang phải
        y: 11.1,
        width: 20.0,
        height: 47.8,
        rotation: 0,
      },
    ],
  },
  {
    id: 'overlay-lay01-03-04',
    name: 'Layout Đôi 03 - 04',
    description: 'Layout đôi photobook trang 3-4 (3 ảnh: 1 ảnh ngang trái, 1 ảnh đứng giữa-trái, 1 ảnh lớn trang phải)',
    slotCount: 3,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/03-04.png',
    slotsCoordinates: [
      {
        x: 4.8,   // Trang trái: ảnh ngang
        y: 28.0,
        width: 24.2,
        height: 38.5,
        rotation: 0,
      },
      {
        x: 32.9,  // Trang trái: ảnh đứng cao
        y: 10.0,
        width: 14.0,
        height: 68.0,
        rotation: 0,
      },
      {
        x: 60.0,  // Trang phải: ảnh lớn
        y: 7.0,
        width: 22.0,
        height: 52.0,
        rotation: 0,
      },
    ],
  },
  {
    id: 'overlay-lay01-05-06',
    name: 'Layout Đôi 05 - 06',
    description: 'Layout đôi photobook trang 5-6 (3 ảnh: 2 ảnh đứng song song trang trái, 1 ảnh hoa văn trang phải)',
    slotCount: 3,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/05-06.png',
    slotsCoordinates: [
      {
        x: 13.0,  // Trang trái: ảnh đứng 1
        y: 18.1,
        width: 18.5,
        height: 58.6,
        rotation: 0,
      },
      {
        x: 32.7,  // Trang trái: ảnh đứng 2
        y: 18.1,
        width: 15.5,
        height: 56.3,
        rotation: 0,
      },
      {
        x: 73.8,  // Trang phải: ảnh nghệ thuật
        y: 10.2,
        width: 20.8,
        height: 48.5,
        rotation: 3.5,
      },
    ],
  },
  {
    id: 'overlay-lay01-09-10',
    name: 'Layout Đôi 09 - 10',
    description: 'Layout đôi photobook trang 9-10 (Trang trái 3 ảnh nghệ thuật, trang phải 1 ảnh vòm lớn và 1 ảnh tròn)',
    slotCount: 5,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/09-10.png',
    slotsCoordinates: [
      { x: 4.0, y: 24.7, width: 11.8, height: 48.9, rotation: 0 },
      { x: 17.6, y: 9.0, width: 15.3, height: 38.1, rotation: 0 },
      { x: 34.8, y: 24.6, width: 13.7, height: 49.6, rotation: 0 },
      { 
        x: 69.2, 
        y: 3.1, 
        width: 24.8, 
        height: 78.9, 
        rotation: 0, 
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 12% 100%, 12% 80%, 10% 70%, 4% 58%, 0 48%)' 
      },
      { 
        x: 54.0, 
        y: 41.7, 
        width: 18.2, 
        height: 47.1, 
        rotation: 0, 
        clipPath: 'circle(50% at 50% 50%)' 
      },
    ],
  },
  {
    id: 'overlay-lay01-11-12',
    name: 'Layout Đôi 11 - 12',
    description: 'Layout đôi photobook trang 11-12 (Trang trái: 1 ảnh ngang & 1 polaroid nghiêng nghệ thuật; Trang phải: 2 ảnh đứng thanh lịch)',
    slotCount: 4,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/11-12.png',
    slotsCoordinates: [
      { x: 4.6, y: 31.7, width: 25.6, height: 33.4, rotation: 0 },
      { x: 32.5, y: 42.8, width: 14.4, height: 49.8, rotation: 7.2 },
      { x: 52.5, y: 14.6, width: 17.2, height: 51.6, rotation: 1.3 },
      { x: 74.3, y: 9.8, width: 20.4, height: 61.1, rotation: 0 },
    ],
  },
  {
    id: 'overlay-lay01-13-14',
    name: 'Layout Đôi 13 - 14',
    description: 'Layout đôi photobook trang 13-14 (Trang trái: 1 ảnh đứng nghiêng 3.4° nghệ thuật; Trang phải: 1 ảnh ngang phong cảnh khổ lớn sang trọng)',
    slotCount: 2,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/13-14.png',
    slotsCoordinates: [
      { x: 23.5, y: 9.5, width: 21.2, height: 50.1, rotation: 3.4 },
      { x: 58.4, y: 17.4, width: 33.8, height: 58.3, rotation: 0 },
    ],
  },
  {
    id: 'overlay-lay01-15-16',
    name: 'Layout Đôi 15 - 16',
    description: 'Layout đôi photobook trang 15-16 (Trang trái: 1 ảnh đứng nghiêng 5.6° & 1 ảnh đứng lớn chính diện; Trang phải: 1 ảnh ngang nghiêng -6.2° & 1 ảnh đứng nghiêng 6.6°)',
    slotCount: 4,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/15-16.png',
    slotsCoordinates: [
      { x: 5.0, y: 13.4, width: 18.2, height: 52.5, rotation: 5.6 },
      { x: 20.0, y: 7.2, width: 24.8, height: 78.0, rotation: 0 },
      { x: 58.4, y: 14.0, width: 21.0, height: 39.8, rotation: -6.2 },
      { x: 69.5, y: 41.8, width: 19.4, height: 50.0, rotation: 6.6 },
    ],
  },
  {
    id: 'overlay-lay01-17-18',
    name: 'Layout Đôi 17 - 18',
    description: 'Layout đôi photobook trang 17-18 (Trang trái: 1 ảnh ngang lớn, 1 polaroid trên nghiêng -6.1° & 1 polaroid dưới; Trang phải: 1 ảnh đứng nghiêng -13.8° & 1 polaroid đứng)',
    slotCount: 5,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/17-18.png',
    slotsCoordinates: [
      { x: 2.8, y: 14.8, width: 28.0, height: 48.2, rotation: 0 },
      { x: 30.8, y: 6.8, width: 17.4, height: 28.5, rotation: -6.1 },
      { x: 31.4, y: 40.6, width: 14.6, height: 48.5, rotation: 1.4 },
      { x: 63.6, y: 31.0, width: 15.6, height: 47.8, rotation: -13.8 },
      { x: 79.8, y: 38.0, width: 16.3, height: 33.5, rotation: 0 },
    ],
  },
  {
    id: 'overlay-lay01-21-22',
    name: 'Layout Đôi 21 - 22',
    description: 'Layout đôi photobook trang 21-22 (2 ảnh toàn cảnh lớn khổ đôi phong cách sang trọng)',
    slotCount: 2,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/21-22.png',
    slotsCoordinates: [
      { x: 8.6, y: 17.6, width: 33.4, height: 57.9, rotation: 0 },
      { x: 57.6, y: 14.6, width: 35.5, height: 55.5, rotation: 0 },
    ],
  },
  {
    id: 'overlay-lay01-23-24',
    name: 'Layout Đôi 23 - 24',
    description: 'Layout đôi photobook trang 23-24 (Trang trái: 1 ảnh đứng trang nhã; Trang phải: 1 ảnh toàn cảnh khổ lớn sang trọng)',
    slotCount: 2,
    aspectRatio: '50:20',
    category: 'vip',
    isOverlay: true,
    overlayUri: 'https://www.photobookvietnam.net/images/layout/lay01/23-24.png',
    slotsCoordinates: [
      { x: 15.0, y: 9.0, width: 20.3, height: 69.0, rotation: 0 },
      { x: 52.5, y: 6.0, width: 45.0, height: 87.8, rotation: 0 },
    ],
  },
];

export const WITH_TEXT_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'album-50x35-memories',
    name: 'Mẫu số 1',
    description: 'Bố cục 50x35 cm: 1 ảnh lớn toàn cảnh bên trái, 2 ảnh xếp dọc ở giữa và bài thơ Memories lãng mạn bên phải',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-in-the-air',
    name: 'Mẫu số 2',
    description: 'Bố cục 50x35 cm: Khung viền chỉ mảnh tinh tế, 1 ảnh ngang bên trái lồng chữ Love is in the air và 1 ảnh đứng trang trọng bên phải',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-celebrate',
    name: 'Mẫu số 3',
    description: 'Bố cục 50x35 cm: 1 ảnh lớn bên trái, 3 ảnh nghệ thuật bên phải cùng lời thề ước tình yêu Celebrate',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-symphony',
    name: 'Mẫu số 4',
    description: 'Bố cục 50x35 cm: 1 ảnh lớn canh giữa trang trọng bên phải, 2 ảnh lồng ghép nghệ thuật bên trái kèm chữ bay bổng Symphony và Fashion Moodboard',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-fairytale',
    name: 'Mẫu số 5',
    description: 'Bố cục 50x35 cm: 1 ảnh toàn cảnh bên phải, 1 ảnh lớn bên trái lồng 1 ảnh nhỏ & chữ nghệ thuật fairytale ABOUT TWO OF US kèm trích dẫn kỳ diệu',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-appreciate',
    name: 'Mẫu số 6',
    description: 'Bố cục 50x35 cm: 1 ảnh đôi nắm tay bước đi bên phải, 1 ảnh cận cảnh lãng mạn bên trái lồng 2 ảnh đứng song song cùng nét thư pháp viết tay lượn sóng tình yêu',
    slotCount: 4,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-together',
    name: 'Mẫu số 7',
    description: 'Bố cục 50x35 cm: 1 ảnh lớn toàn cảnh bên trái, 2 ảnh nghệ thuật đứng kèm trích dẫn Magazine Wedding & câu thề ước ngọt ngào bên phải',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-eternal',
    name: 'Mẫu số 8',
    description: '2 ảnh (1 ảnh lớn full, 1 ảnh nhỏ dọc kèm chữ)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-beloved',
    name: 'Mẫu số 9',
    description: '3 ảnh (1 ảnh lớn phải, 2 ảnh dọc nhỏ trái)',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-passionate',
    name: 'Mẫu số 10',
    description: '2 ảnh (1 ảnh full trái, 1 ảnh dọc phải)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-heartstrings',
    name: 'Mẫu số 11',
    description: '2 ảnh (1 ảnh nền mờ, 1 ảnh chèn lên)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-beyond-time',
    name: 'Mẫu số 12',
    description: '2 ảnh (1 nền tràn viền, 1 ảnh inset nổi bật phải)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-romance',
    name: 'Mẫu số 13',
    description: '3 ảnh (2 ảnh trái có chữ giữa, 1 ảnh dọc phải full)',
    slotCount: 3,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-perfection',
    name: 'Mẫu số 14',
    description: '2 ảnh (Bố cục xen kẽ 4 phần chữ và ảnh)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'with-text',
  },
  {
    id: 'album-50x35-loyalty',
    name: 'Mẫu số 15',
    description: '2 ảnh (1 ảnh arch vòm trái, 1 ảnh full phải)',
    slotCount: 2,
    aspectRatio: '50:35',
    category: 'with-text',
  },
];

export const TEMPLATES: TemplateDefinition[] = [
  ...VIP_TEMPLATES,
  ...BASIC_TEMPLATES,
  ...WITH_TEXT_TEMPLATES,
];

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  tagline: 'SAVE THE DATE',
  taglineFont: 'Montserrat',
  taglineFontSize: 18,
  taglineColor: '#1c1917',
  taglineLetterSpacing: 4,

  dateText: '10.06\n2024',
  dateFont: 'Bodoni Moda',
  dateFontSize: 58,
  dateColor: '#1c1917',
  dateLetterSpacing: 1,

  groomName: 'TUẤN ANH',
  brideName: 'BẢO NGỌC',
  connector: 'and',
  namesFont: 'Bodoni Moda',
  connectorFont: 'Great Vibes',
  namesFontSize: 24,
  namesColor: '#1c1917',

  subtext: 'Rất hân hạnh được đón tiếp quý khách',
  subtextFont: 'Plus Jakarta Sans',
  subtextFontSize: 13,
  subtextColor: '#57534e',

  textAlign: 'center',
  textUppercase: true
};

export const DEFAULT_POSTER_SETTINGS: PosterSettings = {
  bgColor: '#ffffff',
  bgPattern: 'solid',
  gap: 6,
  outerMargin: 16,
  cornerRadius: 0,
  borderStyle: 'none',
  borderColor: '#d6d3d1',
  blockBgColor: '#8b988f',
  aspectRatio: '50:20'
};

export const FONT_OPTIONS = [
  { name: 'Bodoni Moda (Sang trọng)', family: 'Bodoni Moda' },
  { name: 'Playfair Display (Thơ mộng)', family: 'Playfair Display' },
  { name: 'Cinzel (Cổ điển)', family: 'Cinzel' },
  { name: 'Cormorant Garamond (Tinh tế)', family: 'Cormorant Garamond' },
  { name: 'Montserrat (Hiện đại & Sắc nét)', family: 'Montserrat' },
  { name: 'Great Vibes (Chữ viết tay bay bổng)', family: 'Great Vibes' },
  { name: 'Alex Brush (Chữ mềm mại)', family: 'Alex Brush' },
  { name: 'Dancing Script (Nghệ thuật)', family: 'Dancing Script' },
  { name: 'Pinyon Script (Chữ viết Quý tộc)', family: 'Pinyon Script' },
  { name: 'Plus Jakarta Sans (Hiện đại dễ đọc)', family: 'Plus Jakarta Sans' }
];

export const COLOR_PRESETS = [
  { name: 'Đen Tuyền (Classic Black)', value: '#1c1917' },
  { name: 'Nâu Trầm (Warm Charcoal)', value: '#292524' },
  { name: 'Vàng Đồng (Rose Gold / Bronze)', value: '#b45309' },
  { name: 'Đỏ Đô Wedding (Wine Red)', value: '#881337' },
  { name: 'Xanh Navy (Royal Blue)', value: '#1e3a8a' },
  { name: 'Xanh Rêu (Emerald Sage)', value: '#065f46' },
  { name: 'Trắng Sữa (Soft White)', value: '#f8fafc' },
];

export const BG_PRESETS = [
  { name: 'Trắng Sạch (Pure White)', value: '#ffffff' },
  { name: 'Trắng Kem (Warm Ivory)', value: '#fbf9f5' },
  { name: 'Màu Giấy Lụa (Soft Linen)', value: '#f5f3ef' },
  { name: 'Hồng Phấn Lãng Mạn (Blush Pink)', value: '#fdf2f8' },
  { name: 'Xanh Bạc Hà Nhẹ (Soft Sage)', value: '#f0fdf4' },
  { name: 'Đen Sang Trọng (Luxe Black)', value: '#18181b' },
];

export const PHOTO_FILTERS = [
  { id: 'none', name: 'Gốc (Original)', css: 'none' },
  { id: 'warm', name: 'Nắng Ấm (Warm Sun)', css: 'sepia(0.2) contrast(1.05) saturate(1.15) brightness(1.02)' },
  { id: 'vintage', name: 'Film Cổ Điển (Vintage Film)', css: 'sepia(0.35) contrast(0.95) brightness(1.05) hue-rotate(-10deg)' },
  { id: 'bw', name: 'Trắng Đen (Classic B&W)', css: 'grayscale(1) contrast(1.1) brightness(1.02)' },
  { id: 'airy', name: 'Tươi Sáng (Bright & Airy)', css: 'brightness(1.1) contrast(0.95) saturate(1.05)' },
  { id: 'dramatic', name: 'Nghệ Thuật High-Key', css: 'contrast(1.2) saturate(1.2)' },
];

export const createDefaultPage = (
  pageNumber: number,
  templateId: TemplateId = 'album-50x35-memories',
  photoOffset: number = 0
): AlbumPage => {
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const slots = Array.from({ length: template.slotCount }, (_, i) => ({
    id: `slot-p${pageNumber}-${i}`,
    imageUri: SAMPLE_WEDDING_PHOTOS[(photoOffset + i) % SAMPLE_WEDDING_PHOTOS.length] || null,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    filter: 'none',
    rotation: 0,
  }));

  return {
    id: `page-${Date.now()}-${pageNumber}-${Math.random().toString(36).substring(2, 6)}`,
    pageNumber,
    title: `Trang ${pageNumber}`,
    templateId,
    slots,
    textConfig: { ...DEFAULT_TEXT_CONFIG },
    posterSettings: { ...DEFAULT_POSTER_SETTINGS, aspectRatio: template.aspectRatio },
  };
};

export const generateAlbumPages = (pageCount: number = 10, defaultAspectRatio?: string): AlbumPage[] => {
  let photoOffset = 0;
  return Array.from({ length: pageCount }).map((_, i) => {
    const templateDef = WITH_TEXT_TEMPLATES[i % WITH_TEXT_TEMPLATES.length] || WITH_TEXT_TEMPLATES[0];
    const page = createDefaultPage(i + 1, templateDef.id, photoOffset);
    if (defaultAspectRatio) {
      page.posterSettings.aspectRatio = defaultAspectRatio as any;
    }
    photoOffset += templateDef.slotCount;
    return page;
  });
};

export const INITIAL_ALBUM_PAGES: AlbumPage[] = generateAlbumPages(10, '50:20');

