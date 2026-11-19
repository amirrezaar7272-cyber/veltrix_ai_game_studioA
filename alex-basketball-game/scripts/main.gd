extends Control

const BG := Color("#101827")
const PANEL := Color("#1b293b")
const ACCENT := Color("#f5a623")
const TEXT := Color("#f4f7fb")
const MUTED := Color("#a9b7c9")

var energy := 78
var focus := 68
var mood := 55
var skill := 30
var mom_bond := 50
var friend_bond := 40
var step := 0

var time_label: Label
var story_label: Label
var appearance_label: Label
var energy_bar: ProgressBar
var focus_bar: ProgressBar
var mood_bar: ProgressBar
var skill_bar: ProgressBar
var relationship_label: Label
var choices: VBoxContainer

func _ready() -> void:
    _build_ui()
    _refresh()

func _build_ui() -> void:
    var background := ColorRect.new()
    background.color = BG
    background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    add_child(background)

    var margin := MarginContainer.new()
    margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    margin.add_theme_constant_override("margin_left", 28)
    margin.add_theme_constant_override("margin_right", 28)
    margin.add_theme_constant_override("margin_top", 22)
    margin.add_theme_constant_override("margin_bottom", 22)
    add_child(margin)

    var page := VBoxContainer.new()
    page.add_theme_constant_override("separation", 14)
    margin.add_child(page)

    var header := HBoxContainer.new()
    page.add_child(header)
    var title := Label.new()
    title.text = "ALEX  /  ONE DAY AT A TIME"
    title.add_theme_font_size_override("font_size", 27)
    title.add_theme_color_override("font_color", TEXT)
    header.add_child(title)
    var spacer := Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    header.add_child(spacer)
    time_label = Label.new()
    time_label.add_theme_font_size_override("font_size", 17)
    time_label.add_theme_color_override("font_color", ACCENT)
    header.add_child(time_label)

    var body := HBoxContainer.new()
    body.size_flags_vertical = Control.SIZE_EXPAND_FILL
    body.add_theme_constant_override("separation", 16)
    page.add_child(body)

    var left := PanelContainer.new()
    left.custom_minimum_size = Vector2(350, 0)
    left.add_theme_stylebox_override("panel", _panel_style())
    body.add_child(left)
    var stats := VBoxContainer.new()
    stats.add_theme_constant_override("separation", 12)
    left.add_child(stats)

    var identity := Label.new()
    identity.text = "ALEX  •  29 YEARS OLD"
    identity.add_theme_font_size_override("font_size", 21)
    identity.add_theme_color_override("font_color", TEXT)
    stats.add_child(identity)

    var court := ColorRect.new()
    court.custom_minimum_size = Vector2(0, 190)
    court.color = Color("#b87545")
    stats.add_child(court)
    var court_text := Label.new()
    court_text.text = "🏀\n\nTHE COURT"
    court_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    court_text.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    court_text.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    court_text.add_theme_font_size_override("font_size", 25)
    court_text.add_theme_color_override("font_color", Color("#fff0d8"))
    court.add_child(court_text)

    appearance_label = Label.new()
    appearance_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    appearance_label.add_theme_color_override("font_color", MUTED)
    stats.add_child(appearance_label)

    energy_bar = _add_stat(stats, "Physical energy")
    focus_bar = _add_stat(stats, "Mental focus")
    mood_bar = _add_stat(stats, "Mood")
    skill_bar = _add_stat(stats, "Basketball skill")

    relationship_label = Label.new()
    relationship_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    relationship_label.add_theme_color_override("font_color", MUTED)
    relationship_label.text = "Mom: 50   •   Friend: 40"
    stats.add_child(relationship_label)

    var right := PanelContainer.new()
    right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    right.add_theme_stylebox_override("panel", _panel_style())
    body.add_child(right)
    var narrative := VBoxContainer.new()
    narrative.add_theme_constant_override("separation", 14)
    right.add_child(narrative)

    var chapter := Label.new()
    chapter.text = "CHAPTER 01  —  A NEW ROUTINE"
    chapter.add_theme_color_override("font_color", ACCENT)
    chapter.add_theme_font_size_override("font_size", 15)
    narrative.add_child(chapter)

    story_label = Label.new()
    story_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
    story_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    story_label.add_theme_font_size_override("font_size", 20)
    story_label.add_theme_color_override("font_color", TEXT)
    narrative.add_child(story_label)

    var prompt := Label.new()
    prompt.text = "WHAT WILL ALEX DO?"
    prompt.add_theme_color_override("font_color", ACCENT)
    prompt.add_theme_font_size_override("font_size", 15)
    narrative.add_child(prompt)

    choices = VBoxContainer.new()
    choices.add_theme_constant_override("separation", 9)
    narrative.add_child(choices)

    var footer := Label.new()
    footer.text = "Prototype • Your choices shape Alex's body, mind, career and relationships"
    footer.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    footer.add_theme_color_override("font_color", MUTED)
    footer.add_theme_font_size_override("font_size", 13)
    page.add_child(footer)

func _panel_style() -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = PANEL
    style.set_corner_radius_all(16)
    style.set_content_margin_all(18)
    return style

func _add_stat(parent: VBoxContainer, caption: String) -> ProgressBar:
    var group := VBoxContainer.new()
    group.add_theme_constant_override("separation", 3)
    parent.add_child(group)
    var row := HBoxContainer.new()
    group.add_child(row)
    var name := Label.new()
    name.text = caption
    name.add_theme_color_override("font_color", MUTED)
    row.add_child(name)
    var spacer := Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    row.add_child(spacer)
    var number := Label.new()
    number.name = "Number"
    number.text = "0%"
    number.add_theme_color_override("font_color", TEXT)
    row.add_child(number)
    var bar := ProgressBar.new()
    bar.min_value = 0
    bar.max_value = 100
    bar.show_percentage = false
    bar.custom_minimum_size = Vector2(0, 12)
    group.add_child(bar)
    return bar

func _set_stat(bar: ProgressBar, value: int) -> void:
    var safe_value := clampi(value, 0, 100)
    bar.value = safe_value
    var row := bar.get_parent().get_child(0) as HBoxContainer
    (row.get_node("Number") as Label).text = str(safe_value) + "%"

func _refresh() -> void:
    _set_stat(energy_bar, energy)
    _set_stat(focus_bar, focus)
    _set_stat(mood_bar, mood)
    _set_stat(skill_bar, skill)
    relationship_label.text = "Mom: %d   •   Friend: %d" % [mom_bond, friend_bond]
    var times := ["MORNING  •  08:00", "MIDDAY  •  12:30", "AFTERNOON  •  16:00", "EVENING  •  20:00", "DAY COMPLETE"]
    time_label.text = times[mini(step, 4)]
    if mood < 40:
        appearance_label.text = "Alex looks tired and worried"
    elif mood < 75:
        appearance_label.text = "Alex is beginning to look hopeful"
    else:
        appearance_label.text = "Alex looks healthier and more confident"
    _render_step()

func _clear_choices() -> void:
    for child in choices.get_children():
        child.queue_free()

func _add_choice(caption: String, action: Callable) -> void:
    var button := Button.new()
    button.text = caption
    button.custom_minimum_size = Vector2(0, 48)
    button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    button.add_theme_font_size_override("font_size", 17)
    button.add_theme_color_override("font_color", Color("#172033"))
    var normal := StyleBoxFlat.new()
    normal.bg_color = ACCENT
    normal.set_corner_radius_all(10)
    normal.set_content_margin_all(8)
    button.add_theme_stylebox_override("normal", normal)
    var hover := normal.duplicate()
    hover.bg_color = Color("#ffc45c")
    button.add_theme_stylebox_override("hover", hover)
    button.pressed.connect(action)
    choices.add_child(button)

func _render_step() -> void:
    _clear_choices()
    match step:
        0:
            story_label.text = "The alarm rings. Alex is 29, newly graduated, and unsure what comes next. The basketball court is quiet. A focused practice could bring him closer to his dream, but it will cost energy."
            _add_choice("Full practice  •  major skill boost", _full_practice)
            _add_choice("Light shooting  •  conserve energy", _light_practice)
        1:
            story_label.text = "It's midday. Alex's legs are heavy after the morning session. He can recover properly or study game footage to sharpen his decisions."
            _add_choice("Rest and eat  •  recover energy", _rest)
            _add_choice("Study basketball footage  •  improve focus", _study)
        2:
            story_label.text = "A message arrives from Alex's mother. A close friend has also invited him out. He cannot do both today. Who should get his time?"
            _add_choice("Visit Mom  •  strengthen family bond", _visit_mom)
            _add_choice("Meet a friend  •  lift your mood", _meet_friend)
        3:
            story_label.text = "Evening arrives and the court lights come on. Alex can play a local match, or stay home and think about the future he wants — including the people he hopes to keep close."
            _add_choice("Play the evening match", _match)
            _add_choice("Stay home  •  continue the story", _stay_home)
        _:
            story_label.text = "The day is complete. Alex's choices have changed his condition, skills and relationships. Tomorrow will begin with the consequences of today."
            _add_choice("Start another day", _new_day)

func _advance() -> void:
    step += 1
    _refresh()

func _full_practice() -> void:
    skill = mini(100, skill + 14)
    energy = maxi(0, energy - 25)
    focus = mini(100, focus + 4)
    _advance()

func _light_practice() -> void:
    skill = mini(100, skill + 7)
    energy = maxi(0, energy - 12)
    _advance()

func _rest() -> void:
    energy = mini(100, energy + 30)
    focus = mini(100, focus + 8)
    mood = mini(100, mood + 4)
    _advance()

func _study() -> void:
    focus = mini(100, focus + 20)
    skill = mini(100, skill + 3)
    energy = maxi(0, energy - 4)
    _advance()

func _visit_mom() -> void:
    mom_bond = mini(100, mom_bond + 18)
    mood = mini(100, mood + 14)
    focus = mini(100, focus + 5)
    _advance()

func _meet_friend() -> void:
    friend_bond = mini(100, friend_bond + 18)
    mood = mini(100, mood + 16)
    energy = mini(100, energy + 4)
    _advance()

func _match() -> void:
    var performance := skill + energy + focus
    var result := "A difficult loss." if performance < 115 else ("A close win." if performance < 175 else "A brilliant performance!")
    if energy < 25:
        result += " Alex was exhausted; his legs felt slow and his shots lacked power."
    elif focus < 25:
        result += " His mind kept wandering, and he struggled to read the game."
    else:
        result += " His preparation helped him stay composed under pressure."
    energy = maxi(0, energy - 28)
    focus = maxi(0, focus - 8)
    mood = clampi(mood + (8 if performance >= 115 else -5), 0, 100)
    step = 4
    _refresh()
    story_label.text = result + " The match is over. Alex heads home thinking about tomorrow."

func _stay_home() -> void:
    mood = mini(100, mood + 8)
    focus = mini(100, focus + 5)
    step = 4
    _refresh()
    story_label.text = "Alex stays home and writes down three goals: earn a place on a good team, become closer to his mother, and find the courage to let someone new into his life. The match can wait."

func _new_day() -> void:
    energy = mini(100, energy + 18)
    focus = mini(100, focus + 8)
    mood = mini(100, mood + 5)
    step = 0
    _refresh()
