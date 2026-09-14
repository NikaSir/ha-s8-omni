# NikaS S8 OMNI — каноническая база знаний

**Статус:** рабочий канон проекта  
**Дата фиксации:** 2026-09-04  
**Устройство:** S8 OMNI  
**Репозиторий:** `NikaSir/ha-s8-omni`

> Этот файл является единой точкой входа по устройству. Если старый чат, issue, donor-profile, APK-анализ или другой документ противоречит этой БЗ, приоритет имеет факт с более высоким уровнем достоверности в этой БЗ. Новая команда записи не считается подтверждённой только потому, что она существует в Tuya RobotProtocol или у похожего пылесоса.

---

## 1. Уровни достоверности

### `S8_PHYSICALLY_VERIFIED`

Факт подтверждён на нашем S8 OMNI физическим поведением устройства и/или контролируемой записью с readback/status.

Разрешено использовать в production-интеграции.

### `S8_SCHEMA_VERIFIED`

Факт получен из фактической Tuya cloud schema нашего экземпляра/Product ID или из сохранённой диагностики нашего устройства, но соответствующая запись ещё не подтверждена физически.

Разрешено использовать для декодирования, диагностики и подготовки теста. Запись — только после controlled verification.

### `S8_WIRE_VERIFIED`

Формат Raw payload подтверждён фактическим байтовым значением нашего S8 и валидной структурой/checksum.

Направление пакета App→Robot или Robot→App считается отдельным фактом и не выводится автоматически из одного status snapshot.

### `TUYA_STANDARD`

Формат или команда подтверждены открытым официальным Tuya RobotProtocol/SweepRobotTemplate.

Используется как спецификация/референс. Не доказывает, что конкретная генерация команды поддерживается нашим S8.

### `FAMILY_REFERENCE`

Факт относится к близкому OEM/Tuya-пылесосу.

Используется только для поиска гипотез. Numeric DP, enum и payload не переносятся на S8 без собственного подтверждения.

### `UNKNOWN`

Недостаточно данных. Запись запрещена.

---

## 2. Идентификация и архитектура

### 2.1. Наш Tuya Product ID

```text
ouh93tro69lmgafr
```

Уровень: `S8_SCHEMA_VERIFIED`.

### 2.2. Архитектура штатного приложения

Smart Life/Thing Android APK является контейнером Tuya SDK. Значительная часть device-specific логики лазерного робота находится в загружаемой Tuya Panel MiniApp, а не обязательно статически в `base.apk`.

Для роботов Tuya используются отдельные слои:

```text
Smart Life / Thing shell
        ↓
Panel MiniApp
        ↓
publishDps / publishCommands
        ↓
обычные DP + Raw command_trans
        ↓
Tuya LAN / cloud transport
        ↓
S8 OMNI
```

Карта/маршрут могут идти отдельным P2P/data-stream каналом через модули семейства `robot-map` / `robot-data-stream`.

Уровень: `TUYA_STANDARD`, подтверждено устройством наличием соответствующей schema.

### 2.3. Кэш панели

Для исследовательской выгрузки Panel MiniApp используется путь семейства:

```text
/data/user/0/com.tuya.smartlife/files/Godzilla/MiniApp/...
```

Это исследовательский путь, не production-зависимость.

---

## 3. Каноническая DP-карта нашего S8

### 3.1. Физически проверенные DP

| DP | Семантика | Тип | Статус / примечание |
|---:|---|---|---|
| 1 | `power_go` / `switch_go` | bool | `S8_PHYSICALLY_VERIFIED`; запуск/остановочный переход |
| 2 | `pause` | bool | `S8_PHYSICALLY_VERIFIED`; `true` пауза, `false` продолжение |
| 4 | `mode` | enum | `S8_PHYSICALLY_VERIFIED` для `smart`, `chargego`; schema также даёт `zone`, `pose`, `part` |
| 5 | `status` | enum | report-only; никогда не писать |
| 6 | `clean_time` | value | минуты |
| 7 | `clean_area` | value | площадь уборки |
| 8 | `battery_percentage` | value | 0–100 % |
| 9 | `suction` | enum | подтверждены `gentle`, `normal`, `strong` |
| 10 | `cistern` | enum | `closed`, `low`, `middle`, `high` |
| 17 | `edge_brush_life` | value | ресурс боковой щётки |
| 19 | `roll_brush_life` | value | ресурс ролика |
| 21 | `filter_life` | value | ресурс фильтра |
| 25 | `do_not_disturb` | bool | мастер-переключатель DND |
| 26 | `volume_set` | value | 0–100 %, изменение физически проверено |
| 27 | `break_clean` | bool | связанное с продолжением уборки состояние; пока diagnostic-only |
| 28 | `fault` | bitmap | `0` = ошибок нет; значения битов не выдумывать |
| 39 | `customize_mode_switch` | bool | custom-mode flag |
| 41 | `work_mode` | enum | наблюдалось `both_work`; не путать с DP4 |
| 47 | `child_lock` | bool | блокировка кнопок |
| 134 | `dp_dust` | bool | сбор пыли станции; `true` старт / `false` стоп |
| 135 | `dp_roll_clean` | bool | промывка ролика; `true` старт / `false` стоп |
| 136 | `dp_roll_hot` | bool | сушка ролика; `true` старт / `false` стоп |

### 3.2. Schema-verified DP нашего S8

| DP | Code | Тип | Статус |
|---:|---|---|---|
| 3 | `switch_charge` | bool | schema verified; production пока использует `mode=chargego` |
| 11 | `seek` | bool | найти робот; запись ещё не физически верифицирована интеграцией |
| 12 | `direction_control` | enum | `forward/backward/turn_left/turn_right/stop` |
| 13 | `map_reset` | bool | потенциально разрушительная запись; без controlled-test не использовать |
| 14 | `path_data` | Raw | данные маршрута |
| 15 | `command_trans` | Raw | **подтверждённый complex-command transport нашего S8** |
| 16 | `request` | enum | `get_map/get_path/get_both` |
| 18 | reset edge brush | bool | reset расходника |
| 20 | reset roll brush | bool | reset расходника |
| 22 | reset filter | bool | reset расходника |
| 32 | `device_timer` | Raw | legacy RobotProtocol timer transport |
| 33 | `disturb_time_set` | Raw | legacy RobotProtocol DND schedule transport |
| 34 | `device_info` | Raw | служебный Raw DP |
| 35 | `voice_data` | Raw | voice package/status transport |
| 36 | `language` | enum | язык |
| 37 | `dust_collection_num` | value | параметр станции |
| 38 | `dust_collection_switch` | bool | параметр станции |

### 3.3. DP145

```text
DP145 = НЕ ИСПОЛЬЗОВАТЬ
```

Он отсутствует в восстановленной cloud schema нашего Product ID и не присутствовал в повторных обычных LAN snapshots. Старые гипотезы о DP145 считать отменёнными.

---

## 4. Физически подтверждённые управляющие последовательности

### 4.1. Новый Smart-start

Отправлять одним атомарным Tuya LAN request:

```text
DP4 = smart
DP2 = false
DP1 = true
```

Причина: отдельные записи создают промежуточные состояния, на которые робот может отреагировать.

Уровень: `S8_PHYSICALLY_VERIFIED`.

### 4.2. Продолжить после паузы

```text
DP2 = false
```

Не дописывать после этого `DP1=true`: физический тест показал, что это может снова привести к паузе.

Уровень: `S8_PHYSICALLY_VERIFIED`.

### 4.3. Пауза

```text
DP1 = false
DP2 = true
```

Уровень: `S8_PHYSICALLY_VERIFIED`.

### 4.4. Возврат на базу во время уборки

```text
DP1 = false
DP2 = true
wait status = standby | paused
DP4 = chargego
wait status = goto_charge | repositing | charging | charge_done
```

Прямой `chargego` во время активной уборки может быть принят устройством, но не привести к движению. После фактического перехода в standby/paused возврат работает.

Уровень: `S8_PHYSICALLY_VERIFIED`.

### 4.5. Возврат на базу из покоя

```text
DP4 = chargego
```

Далее ждать фактического return/dock status.

Уровень: `S8_PHYSICALLY_VERIFIED`.

### 4.6. Операции станции

```text
DP134 true/false  → сбор пыли старт/стоп
DP135 true/false  → промывка ролика старт/стоп
DP136 true/false  → сушка ролика старт/стоп
```

Старт разрешать только при подтверждённой парковке (`charging` / `charge_done` или эквивалентный канонический dock-state).

Уровень: `S8_PHYSICALLY_VERIFIED`.

---

## 5. Статусная модель

### 5.1. DP5 — report-only

DP5 никогда не записывается.

Нормализация:

```text
standby       → idle
smart/cleaning→ cleaning
zone_clean    → zone_cleaning
part_clean    → room_cleaning (semantic normalization only)
paused        → paused
goto_charge   → returning_to_dock
charging      → charging
charge_done   → charged
sleep         → sleeping
fault         → error
repositing    → repositioning
unknown value → unknown
```

Важно: `part_clean → room_cleaning` является статусной нормализацией интерфейса, а не доказательством того, что `DP4=part` — точная outbound-команда room clean.

### 5.2. Статус станции

```text
DP134=true → dust_collection
DP135=true → roller_cleaning
DP136=true → drying
```

Если активны несколько — `multiple_operations`.

Если все три присутствуют и false — `idle`.

Если ни одна операция не активна, но один из необходимых DP отсутствует — `unknown`, не `idle`.

### 5.3. Docked не означает idle станции

`docked` означает только физическое нахождение на базе. Сушка/мойка/сбор пыли имеют отдельное состояние.

---

## 6. Локальная связь и актуальность данных

Интеграция S8 OMNI — `local_polling`.

Нет подразумеваемого cloud fallback.

Правила:

```text
до первого успешного poll     → Нет данных
успешный текущий poll         → Локально
неуспешный текущий poll       → Нет связи
```

Телеметрия считается актуальной только если:

- есть успешный snapshot;
- текущий poll успешен;
- возраст snapshot ≤ `scan_interval * 3`.

При ошибке текущего poll данные сразу считаются устаревшими, даже если последний успешный snapshot ещё молодой.

По умолчанию:

```text
scan_interval = 5 s
allowed = 3..60 s
stale threshold = scan_interval * 3
```

При потере связи cached values сохраняются только для диагностики, но не выдаются UI как текущая истина. Управление блокируется, polling продолжается.

---

## 7. Реальный Raw-протокол нашего S8

### 7.1. DP15 — `command_trans`

Фактическое сохранённое значение нашего S8:

```text
qgABFxeqAAITABOqAAIbABuqAAMpAAApqgADFQAAFQ==
```

Разбивается на пять валидных legacy RobotProtocol V0 кадров:

```text
AA 00 01 17 17
AA 00 02 13 00 13
AA 00 02 1B 00 1B
AA 00 03 29 00 00 29
AA 00 03 15 00 00 15
```

Это доказывает:

1. `DP15` действительно несёт RobotProtocol;
2. наш S8 использует legacy `AA 00` generation;
3. counterpart/opcode family включает `0x17/0x13/0x1B/0x29/0x15`.

Направление этого сохранённого status snapshot **не доказано**. Поэтому каноническая маркировка:

```text
S8_LEGACY_COMPLEX_STATE_BUNDLE
direction = NOT_PROVEN_FROM_STATUS_SNAPSHOT
```

### 7.2. Формат legacy V0

```text
AA 00 LL CMD DATA CHECKSUM
```

где:

```text
LL = bytes(CMD + DATA)
CHECKSUM = sum(CMD + DATA) mod 256
```

### 7.3. Общий Tuya frame format

Tuya-standard также знает:

```text
AA 01 LLLLLLLL CMD DATA CHECKSUM
AB 00 LLLLLLLL CMD DATA CHECKSUM
```

Для нашего S8 complex-map family ведущим является именно подтверждённый `AA 00` legacy generation. `AB` фактически наблюдался на voice DP35.

---

## 8. Complex commands: канонический статус

### 8.1. Выбор комнаты

Подтверждено:

```text
DP15 = command_trans Raw
legacy SET opcode family = 0x14
counterpart = 0x15
```

Tuya-standard payload `0x14`:

```text
cleanTimes
roomCount
roomId[roomCount]
```

Пример structurally-valid V0 для одной комнаты ID=3, 1 проход:

```text
AA 00 04 14 01 01 03 19
```

Это **offline candidate**, не разрешённая команда production.

Не подтверждено на outbound S8:

```text
DP4 = part  ?
точный порядок DP15/DP4/DP1/DP2 ?
room IDs текущей карты ?
```

S8 schema содержит:

```text
smart, zone, pose, part, chargego
```

и **не содержит `select_room`**.

Публичный Tuya SweepRobotTemplate использует `select_room`, включая старую опубликованную версию 2024 года. Поэтому `part` остаётся сильной S8-specific гипотезой, но не write-verified фактом.

### 8.2. Zone clean

Ведущая legacy family для S8:

```text
SET 0x28
counterpart 0x29
DP4 candidate = zone
```

Фактический retained `0x29` S8 начинается как:

```text
cleanTimes=0
zoneCount=0
```

Координаты нельзя формировать без map origin/scale.

### 8.3. Spot / «Куда убрать»

Ведущая legacy family:

```text
SET 0x16
counterpart 0x17
DP4 candidate = pose
```

Координаты — только после подтверждения map origin/scale.

### 8.4. Virtual wall

Ведущая legacy family:

```text
SET 0x12
counterpart 0x13
```

### 8.5. Restricted / no-go area

Ведущая legacy family:

```text
SET 0x1A
counterpart 0x1B
```

### 8.6. Более новые Tuya поколения

Команды:

```text
room 0x56/57
zone 0x3A/3B
spot 0x3E/3F
restricted area 0x38/39
```

считать `TUYA_STANDARD` reference, но **не ведущими S8-кандидатами**, поскольку фактический S8 DP15 уже показал legacy counterparts.

---

## 9. Комнаты и карта

### 9.1. Room ID

Tuya `0x14/0x15` использует byte `roomId`.

Связь `roomId` с bitmap `roomHexId` зависит от версии карты.

Для map v1:

```text
roomHexId = roomId << 2
```

Для map v2/v3:

```text
roomHexId = (roomId << 3) | 0b111
```

Примеры:

```text
roomId 3 → v1 0x0C ; v2/v3 0x1F
roomId 4 → v1 0x10 ; v2/v3 0x27
```

Обратное преобразование в Tuya parser берёт старшие 6 бит для v1 и старшие 5 бит для v2/v3.

### 9.2. Map state

После разбора Tuya map layer получает как минимум:

```text
map id
map version
width / height
origin
charger position
map stable/status
room properties
```

Для zonal/spot commands необходимы фактические `origin` и `mapScale/version`.

### 9.3. Канал карты

Карта/маршрут могут передаваться через P2P stream, а не обычный LAN `status()`.

Следствие: отсутствие карты/`command_trans` в обычном polling snapshot не доказывает отсутствия функции.

---

## 10. Timer / DND / Voice — фактические Raw transports

### 10.1. Timer — DP32

Фактический S8 report использует legacy:

```text
0x31 report
0x30 matching SET generation
```

Сохранённый timer декодирован как:

```text
timezone +3
enabled timer
week mask 0x7F
20:30
whole house
clean mode raw 0
fan raw 2
water raw 3
2 passes
```

`roomCount=0` в этом сохранённом timer не даёт room IDs.

### 10.2. DND schedule — DP33

Фактический report:

```text
0x33
```

Ведущий matching SET:

```text
0x32
```

Наблюдаемое расписание:

```text
23:59 → 06:40
```

Это заменяет старую generic-гипотезу `0x40/0x41` для нашего S8.

### 10.3. Voice — DP35

Фактический payload использует extended `AB` frame `0x35`.

Декодировано:

```text
languageId = 0
status = 3
progress = 100
```

Matching legacy/extended SET family — `0x34`.

---

## 11. Tuya-standard порядок complex writes

Официальный SweepRobotTemplate содержит явное правило:

```text
complex DP writes must not be merged
commands -> mode -> switch/pause
```

Для generic room-clean шаблон делает:

```text
command_trans = encoded room command
mode = select_room
switch_go = true
```

Для zone:

```text
command_trans
mode = zone
switch_go = true
```

Для pose:

```text
command_trans
mode = pose
switch_go = true
```

Это `TUYA_STANDARD` и сильный reference для S8, но exact S8 values/order должны подтверждаться outbound capture.

Не смешивать это правило с физически проверенным **обычным Smart-start S8**, который сейчас специально выполняется атомарным request из DP4/DP2/DP1.

---

## 12. Официальная терминология приложения

Использовать английские labels как semantic reference, потому что локализация может быть непоследовательной.

Наблюдаемые термины:

```text
Smart
Select Room
Zone Cleaning
Where To Sweep
Quiet / Normal / Strong
Closed / Low / Medium / High
Timer
Room Manage
Record
Voice and volume
Switch disturb
Manual
Consumables management
Seek Robot
Button Child Lock
Breakpoint continuous scanning
Dust box collects dust
Mop self cleaning
Mop drying
```

UI label не является доказательством конкретного DP write.

---

## 13. OEM / family references

### 13.1. BSTY / M3 / M3-2 / Amicro

Найдена близкая аппаратная ветка BSTY M3/M3-2. FCC-документация M3-2 указывает приложение Amicro Smart. По аппаратным функциям станции и роликовой мойки семейство близко к S8.

Статус: `FAMILY_REFERENCE`.

Нельзя утверждать идентичность firmware или переносить команды без S8 capture.

### 13.2. Amicro Smart

Пакет семейства:

```text
com.amicro.hoslam
```

Публичная версия приложения упоминала обновление Tuya SDK.

Статус: `FAMILY_REFERENCE` / источник для будущего статического сравнения.

### 13.3. Cecotec Conga X70

Product ID внешнего устройства:

```text
j9a3cjk1xuzjakgp
```

Его cloud schema чрезвычайно близка к старому S8 contract:

```text
DP15 command_trans
DP16 request
DP32/33/35 Raw
mode = smart/zone/pose/part/chargego
```

и близкая раскладка DP1..39.

Статус: `FAMILY_REFERENCE_ONLY`.

### 13.4. Proscenic Q8

Независимый современный reverse-engineering подтвердил реальное использование `command_trans` и legacy room `0x14` V0 на другом Tuya-пылесосе.

Полезно как wire-format corroboration, но не источник numeric DP/room IDs S8.

---

## 14. Что специально НЕ считается доказанным

До отдельного захвата/теста запрещено считать фактами:

- `DP4=part` как точный room-start mode;
- room IDs текущей S8 карты;
- origin/scale карты;
- точный outbound room SET нашего Smart Life;
- точный outbound zone/spot SET нашего Smart Life;
- virtual wall/no-go write на S8;
- reset map;
- consumables reset;
- ручное направление DP12;
- seek DP11;
- бинарный DND SET;
- timer SET;
- voice package SET;
- любые writes в DP145;
- донорские DP/frames от BSTY/Conga/Proscenic.

---

## 15. Правило допуска новой команды в production

Новая команда записи получает `S8_PHYSICALLY_VERIFIED` только если выполнены все пункты:

1. Numeric DP подтверждён фактической S8 schema по exact `code`.
2. Для Raw-команды определён точный frame generation нашего S8.
3. Payload проходит length/checksum validation.
4. Если команда получена из штатной панели — зафиксирован outbound capture.
5. Повтор той же операции даёт ожидаемо стабильный payload либо объяснимые динамические поля.
6. Изменение одного пользовательского параметра меняет ожидаемый байт/поле.
7. Команда воспроизводится локально на S8.
8. Физическое поведение соответствует ожидаемому.
9. Readback/status подтверждает результат.
10. Известен безопасный stop/recovery path.
11. Только после этого команда переносится из research в production.

---

## 16. Следующий минимальный capture для комнат

Предпочтительная последовательность:

```text
1. same room -> start -> stop
2. same room -> start -> stop
3. different room -> start -> stop
4. one zone -> start -> stop
5. one point -> start -> stop
```

Первые три capture должны установить:

```text
exact outbound 0x14
cleanTimes
roomCount
roomId
stability of same-room payload
byte difference between rooms
actual DP15/DP4/DP1/DP2 order
actual scalar room mode
```

---

## 17. Исследовательские инструменты

В research-ветке:

```text
scripts/tuya_robot_protocol.py
```
Generic offline AA/AB decoder/encoder и schema inspector. Нет сетевого write-path.

```text
scripts/tuya_robot_log_extract.py
```
Извлечение hex/Base64 RobotProtocol, включая concatenated frame streams.

```text
scripts/s8_legacy_payload_decode.py
```
S8-specific decoder для фактических DP15/32/33/35 и legacy payload.

```text
scripts/s8_legacy_candidate_frames.py
```
Offline-only builder legacy room/zone/spot candidate frames.

```text
scripts/s8_raw_dp_monitor.py
```
Read-only LAN monitor unknown/raw DP; большие payload сохраняются как length + SHA-256.

```text
scripts/s8_room_capture_analyzer.py
```
Разбирает Frida outbound capture, извлекает `0x14`, `cleanTimes`, `roomIds`, последовательность DP и кандидаты bitmap roomHexId.

```text
scripts/s8_room_capture_compare.py
```
Сравнивает несколько room captures byte-by-byte и показывает стабильные/изменившиеся поля.

```text
research/s8_apk/frida_smartlife_publish_dps.js
```
Пассивный hook исходящих `publishDps/publishCommands`; не модифицирует вызов.

```text
research/s8_apk/capture_smartlife_s8_panel.sh
```
Focused capture `Godzilla/MiniApp` на тестовом Android/rooted emulator.

```text
research/s8_apk/pull_smartlife_apks.sh
```
Выгрузка base/split APK через ADB без root.

---

## 18. Связанные документы

Эта БЗ является верхнеуровневым каноном. Подробные доказательства и узкие отчёты остаются как приложения:

```text
docs/PROTOCOL.md
```
Production DP/status/connection contract.

```text
docs/APK_PROTOCOL_RESEARCH.md
```
APK/Panel MiniApp/Tuya RobotProtocol исследование.

```text
docs/RESEARCH_STATUS_20260904.md
```
Снимок текущей исследовательской стадии.

```text
docs/OEM_PRIMARY_EVIDENCE_BSTY_M3_2.md
```
OEM/FCC evidence BSTY M3-2.

```text
docs/FAMILY_REFERENCE_CECOTEC_CONGA_X70.md
```
Close-family Tuya schema reference.

```text
docs/TUYA_UPSTREAM_CHECKSUM_ANOMALY.md
```
Зафиксированная ошибка checksum в одном публичном Tuya room-report fixture.

При конфликте деталей использовать уровни достоверности из раздела 1 и факты более высокого уровня.

---

## 19. Короткая памятка для дальнейшей работы

```text
Обычная уборка:
  atomic DP4=smart + DP2=false + DP1=true

Continue:
  DP2=false

Pause:
  DP1=false -> DP2=true

Home from cleaning:
  Pause -> wait standby/paused -> DP4=chargego

Station:
  134 dust
  135 wash
  136 dry

Complex transport:
  DP15 command_trans Raw
  actual S8 generation = legacy AA 00

Leading S8 complex families:
  room 0x14/15
  zone 0x28/29
  spot 0x16/17
  wall 0x12/13
  no-go 0x1A/1B

Raw service transports:
  DP32 timer 0x30/31
  DP33 DND 0x32/33
  DP35 voice 0x34/35 (AB observed)

NEVER:
  write DP5
  write DP145
  import donor numeric DP blindly
  enable complex write before outbound S8 capture + physical verification
```
