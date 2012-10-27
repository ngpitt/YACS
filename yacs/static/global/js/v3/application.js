// Generated by CoffeeScript 1.3.3
(function() {
  var bind_schedule_events, conflict_runner, courses, create_color_map, create_set_index_for_schedule, create_summaries, create_timemap, current_schedule, days_of_the_week, display_schedules, has_initialized, initialize_validator, saved_selection_id, selection, template_functions, templates, validator, visualize_conflicts;

  if ($('.content').length === 0) {
    return;
  }

  days_of_the_week = 'Monday Tuesday Wednesday Thursday Friday'.split(' ');

  create_summaries = function() {
    var elements;
    elements = $('.summarize').not('.has-summary');
    summarize(elements, {
      summary_length: 150
    });
    return elements.addClass('has-summary');
  };

  $(function() {
    return create_summaries();
  });

  templates = null;

  $(function() {
    return window.templates = templates = find_templates();
  });

  $(function() {
    var original_html, spinner;
    spinner = $('#search-spinner');
    original_html = $('#replacable-with-search').html();
    return updateform('#searchform', {
      start: function() {
        return spinner.show();
      },
      data: {
        partial: 1
      },
      update: function(html) {
        $('#replacable-with-search').html(html);
        create_summaries();
        visualize_conflicts();
        return spinner.fadeOut();
      },
      empty: function() {
        $('#replacable-with-search').html(original_html);
        return visualize_conflicts();
      },
      error: function() {
        return spinner.fadeOut();
      }
    });
  });

  $(function() {
    var data;
    data = $('meta[name=semester_id]');
    if (data.length) {
      return api.filter({
        semester_id: parseInt(data.attr('content'), 10)
      });
    }
  });

  courses = null;

  window.validator = validator = new Validator();

  has_initialized = false;

  initialize_validator = function() {
    var callback;
    if (has_initialized) {
      return;
    }
    $('input[type=checkbox]').attr('disabled', 'disabled');
    callback = barrier(3, function() {
      has_initialized = true;
      $('input[type=checkbox]').removeAttr('disabled');
      return $(validator).trigger('load');
    });
    api.courses(function(data) {
      courses = data;
      return callback();
    });
    api.conflicts(function(conflicts) {
      validator.set_conflicts(conflicts);
      return callback();
    });
    return api.sections(function(sections) {
      validator.set_sections(sections);
      return callback();
    });
  };

  initialize_validator();

  conflict_runner = null;

  visualize_conflicts = function() {
    if (conflict_runner != null) {
      conflict_runner.abort();
    }
    return conflict_runner = iterate($('.course > input[type=checkbox]'), {
      each: function(element, i) {
        var cid, conflicted_sections, course, course_id, el, name, s, sec2course, section, section_id, section_ids, _i, _j, _len, _len1, _results;
        el = $(element);
        course_id = parseInt(el.attr('data-cid'), 10);
        section_ids = array_of_ints(el.attr('data-sids'));
        conflicted_sections = [];
        s = selection.copy();
        validator.set_data(s.data);
        sec2course = {};
        for (_i = 0, _len = section_ids.length; _i < _len; _i++) {
          section_id = section_ids[_i];
          s.add_section(course_id, section_id);
          validator.set_data(s.data);
          if (!validator.is_valid()) {
            conflicted_sections.push(section_id);
          }
          s.undo();
          cid = validator.conflicts_with(section_id);
          if (cid != null) {
            conflicted_sections.push(section_id);
            sec2course[section_id] = cid;
          } else {
            s.add_section(course_id, section_id);
            validator.set_data(s.data);
            if (!validator.is_valid()) {
              conflicted_sections.push(section_id);
            }
            s.undo();
          }
        }
        course = $('#course_' + course_id).parent().removeClass('conflict');
        course.find('.conflict').removeClass('conflict');
        course.find('.conflicts_with_course, .conflicts_with_section').remove();
        course.find('input[type=checkbox]').removeAttr('disabled');
        conflicted_sections = _.uniq(conflicted_sections);
        if (conflicted_sections.length === section_ids.length) {
          if ($('#course_' + course_id).checked()) {
            return;
          }
          course.addClass('conflict');
          if (sec2course[conflicted_sections[0]] != null) {
            name = courses.get(sec2course[conflicted_sections[0]]).get('name');
          } else {
            name = 'selection';
          }
          course.append(templates.conflict_template({
            classname: 'conflicts_with_course',
            name: name
          }));
          return course.find('input[type=checkbox]').attr('disabled', 'disabled');
        } else {
          _results = [];
          for (_j = 0, _len1 = conflicted_sections.length; _j < _len1; _j++) {
            section_id = conflicted_sections[_j];
            if ($('#section_' + section_id).checked()) {
              continue;
            }
            section = $('#section_' + section_id).attr('disabled', 'disabled');
            section = section.parent().addClass('conflict');
            if (sec2course[conflicted_sections[0]] != null) {
              name = courses.get(sec2course[section_id]).get('name');
            } else {
              name = 'selection';
            }
            _results.push(section.find('label').append(templates.conflict_template({
              classname: 'conflicts_with_section',
              name: name
            })));
          }
          return _results;
        }
      },
      end: function() {
        return conflict_runner = null;
      }
    });
  };

  $(validator).bind('load', function() {
    return visualize_conflicts();
  });

  window.selection = selection = new Selection().load();

  $(function() {
    var cid, sid, _i, _len, _ref, _results;
    _ref = selection.get_courses();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cid = _ref[_i];
      $('#course_' + cid).checked(true);
      _results.push((function() {
        var _j, _len1, _ref1, _results1;
        _ref1 = selection.get(cid);
        _results1 = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          sid = _ref1[_j];
          _results1.push($('#section_' + sid).checked(true));
        }
        return _results1;
      })());
    }
    return _results;
  });

  $(function() {
    $('.course > input[type=checkbox]').live('click', function() {
      var course_id, el, free_section_ids, full_section_ids, is_checked, parent, section_id, section_ids, sections, valid_sections, _i, _j, _k, _len, _len1, _len2;
      el = $(this);
      is_checked = el.checked();
      course_id = parseInt(el.attr('data-cid'), 10);
      section_ids = array_of_ints(el.attr('data-sids'));
      full_section_ids = array_of_ints(el.attr('data-sids-full'));
      free_section_ids = _.difference(section_ids, full_section_ids);
      parent = el.parent();
      sections = (free_section_ids.length ? free_section_ids : section_ids);
      if (is_checked) {
        valid_sections = [];
        for (_i = 0, _len = sections.length; _i < _len; _i++) {
          section_id = sections[_i];
          validator.set_data(selection.data);
          if (!validator.conflicts_with(section_id)) {
            selection.add_section(course_id, section_id);
            validator.set_data(selection.data);
            if (!validator.is_valid(section_ids)) {
              console.log('undo', section_id);
              selection.undo();
            } else {
              console.log('add', section_id);
              valid_sections.push(section_id);
            }
          } else {
            console.log('obvious conflict', section_id);
          }
        }
        for (_j = 0, _len1 = valid_sections.length; _j < _len1; _j++) {
          section_id = valid_sections[_j];
          parent.find('#section_' + section_id).checked(is_checked);
        }
        if (valid_sections.length === 0) {
          el.checked(false);
          return false;
        }
      } else {
        validator.set_data(selection.data);
        selection.remove_course(course_id, section_ids);
        for (_k = 0, _len2 = sections.length; _k < _len2; _k++) {
          section_id = sections[_k];
          parent.find('#section_' + section_id).checked(is_checked);
        }
      }
      visualize_conflicts();
      return selection.save();
    });
    return $('.section > input[type=checkbox]').live('click', function() {
      var checked_courses, course_id, el, is_checked, parent, section_id;
      el = $(this);
      is_checked = el.checked();
      course_id = parseInt(el.attr('data-cid'), 10);
      section_id = parseInt(el.attr('data-sid'), 10);
      validator.set_data(selection.data);
      if (validator.conflicts_with(section_id)) {
        return false;
      }
      if (is_checked) {
        selection.add_section(course_id, section_id);
      } else {
        selection.remove_section(course_id, section_id);
      }
      validator.set_data(selection.data);
      if (!validator.is_valid()) {
        selection.undo();
        return false;
      }
      parent = el.parents('.course');
      checked_courses = false;
      parent.find('.section > input[type=checkbox]').each(function() {
        if ($(this).checked() === true) {
          return checked_courses = true;
        }
      });
      if (!checked_courses || is_checked) {
        parent.find('> input[type=checkbox]').checked(is_checked);
      }
      visualize_conflicts();
      return selection.save();
    });
  });

  template_functions = {
    display_time: function(period) {
      var end, fmt, start, time_fmt;
      fmt = '{{ 0 }}-{{ 1 }}';
      start = Time.parse_military(period.start);
      end = Time.parse_military(period.end);
      time_fmt = '{{ hour }}{{ sep_if_min }}{{ zmin_if_min }}';
      return format(fmt, start.format(time_fmt + ((start.isAM() === end.isAM()) || (start.isPM() === end.isPM()) ? '' : '{{ apm }}')), end.format(time_fmt + '{{ apm }}'));
    },
    periods_by_dow: function(periods) {
      var dow, period, remapped_periods, _i, _j, _k, _len, _len1, _len2, _ref;
      remapped_periods = {};
      for (_i = 0, _len = days_of_the_week.length; _i < _len; _i++) {
        dow = days_of_the_week[_i];
        remapped_periods[dow] = [];
      }
      for (_j = 0, _len1 = periods.length; _j < _len1; _j++) {
        period = periods[_j];
        _ref = period.days_of_the_week;
        for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
          dow = _ref[_k];
          remapped_periods[dow].push(period);
        }
      }
      return remapped_periods;
    },
    pluralize: function(text, number, pluralize_text) {
      if (pluralize_text == null) {
        pluralize_text = 's';
      }
      if (number !== 1) {
        return text + pluralize_text;
      } else {
        return text;
      }
    },
    period_offset: function(period, height) {
      var start, time;
      start = Time.parse_military(period.start);
      time = start.minute * 60 + start.second;
      return time / 3600.0 * height;
    },
    period_height: function(period, height) {
      var time;
      time = Time.parse_military(period.end).toInt() - Time.parse_military(period.start).toInt();
      return time / 3600.0 * height;
    }
  };

  saved_selection_id = function() {
    var index, path;
    path = location.href.split('/');
    index = path.indexOf('selected');
    if (index === -1 || path.length - 1 === index) {
      return 0;
    }
    return parseInt(path[index + 1], 10);
  };

  $(function() {
    var display_selection, process_selection, target;
    target = $('#selected_courses');
    if (!target.length) {
      return;
    }
    process_selection = function() {
      var saved_id;
      saved_id = saved_selection_id();
      if (saved_id) {
        $('[data-action=clear-selection]').hide();
      }
      if (saved_id) {
        return api.selection((function(sel) {
          window.selection = selection = new Selection({
            data: sel.get('data'),
            read_only: true
          });
          return display_selection();
        }), (function() {
          return console.error('Failed to load selection');
        }), saved_id);
      } else {
        return display_selection();
      }
    };
    display_selection = function() {
      var callback, departments, sections;
      $('[data-action=clear-selection]').click(function() {
        if (confirm('Clear all your selected courses?')) {
          selection.clear();
          location.reload();
        }
        return false;
      });
      if (selection.has_courses()) {
        sections = null;
        departments = null;
        courses = null;
        callback = barrier(3, function() {
          var course, course_id, section, _i, _j, _len, _len1, _ref, _ref1;
          target.empty();
          _ref = selection.get_courses();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            course_id = _ref[_i];
            course = courses.get(course_id).to_hash();
            course.sections = (function() {
              var results;
              results = _.filter(sections.to_array(), function(s) {
                return s.get('course_id') === course.id;
              });
              return _.map(results, function(s) {
                return s.to_hash();
              });
            })();
            _ref1 = course.sections;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              section = _ref1[_j];
              section.instructors = (function() {
                return _.pluck(section.section_times, 'instructor');
              })();
              section.seats_left = section.seats_total - section.seats_taken;
            }
            course.section_ids = (function() {
              return _.pluck(course.sections, 'id');
            })();
            course.full_section_ids = (function() {
              return _.pluck(_.filter(course.sections, function(s) {
                return s.seats_taken >= s.seats_total;
              }), 'id');
            })();
            course.seats_total = (function() {
              return _.reduce(course.sections, (function(accum, item) {
                return accum + item.seats_total;
              }), 0);
            })();
            course.seats_taken = (function() {
              return _.reduce(course.sections, (function(accum, item) {
                return accum + item.seats_left;
              }), 0);
            })();
            course.seats_left = course.seats_total - course.seats_left;
            course.department = (function() {
              return departments.get(course.department_id).to_hash();
            })();
            course.instructors = (function() {
              var kinds, times, _k, _l, _len2, _len3, _ref2, _ref3;
              kinds = [];
              _ref2 = course.sections;
              for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                section = _ref2[_k];
                _ref3 = section.section_times;
                for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                  times = _ref3[_l];
                  pushUnique(kinds, times.instructor);
                }
              }
              return kinds;
            })();
            course.kinds = (function() {
              var kinds, times, _k, _l, _len2, _len3, _ref2, _ref3;
              kinds = [];
              _ref2 = course.sections;
              for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                section = _ref2[_k];
                _ref3 = section.section_times;
                for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                  times = _ref3[_l];
                  pushUnique(kinds, times.kind);
                }
              }
              return kinds;
            })();
            course.notes = (function() {
              return _.pluck(course.sections, 'notes');
            })();
            target.append(templates.course_template({
              course: course,
              days_of_the_week: days_of_the_week,
              _: _,
              alwaysShowSections: true,
              isReadOnly: false,
              isSelectedSection: function(section_id) {
                return _.include(selection.get_sections(), section_id);
              },
              displayTime: template_functions.display_time,
              periodsByDayOfWeek: template_functions.periods_by_dow,
              pluralize: template_functions.pluralize
            }));
          }
          return create_summaries('.summarize');
        });
        api.courses(function(data) {
          courses = data;
          return callback();
        });
        api.sections(function(data) {
          sections = data;
          return callback();
        });
        return api.departments(function(data) {
          departments = data;
          return callback();
        });
      } else {
        return target.html(templates.no_courses_template());
      }
    };
    return process_selection();
  });

  create_color_map = function(schedule, maxcolors) {
    var cid, color_map, i, keys, _i, _ref;
    color_map = {};
    maxcolors = maxcolors || 9;
    keys = Object.keys(schedule);
    for (i = _i = 0, _ref = keys.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      cid = keys[i];
      color_map[cid] = (i % maxcolors) + 1;
    }
    return color_map;
  };

  create_timemap = function(schedule, sections, dows, time_range) {
    var cid, dow, map, period, scheduleSections, section, section_id, section_ids, startingHour, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1;
    map = {};
    for (_i = 0, _len = dows.length; _i < _len; _i++) {
      dow = dows[_i];
      map[dow] = {};
    }
    scheduleSections = [];
    section_ids = (function() {
      var _j, _len1, _ref, _results;
      _ref = Object.keys(schedule);
      _results = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        cid = _ref[_j];
        _results.push(schedule[cid]);
      }
      return _results;
    })();
    for (_j = 0, _len1 = section_ids.length; _j < _len1; _j++) {
      section_id = section_ids[_j];
      scheduleSections.push(sections.get(section_id).to_hash());
    }
    for (_k = 0, _len2 = scheduleSections.length; _k < _len2; _k++) {
      section = scheduleSections[_k];
      _ref = section.section_times;
      for (_l = 0, _len3 = _ref.length; _l < _len3; _l++) {
        period = _ref[_l];
        _ref1 = period.days_of_the_week;
        for (_m = 0, _len4 = _ref1.length; _m < _len4; _m++) {
          dow = _ref1[_m];
          startingHour = Time.parse_military(period.start).hour;
          map[dow][startingHour] = period;
        }
      }
    }
    return map;
  };

  create_set_index_for_schedule = function(schedules, response, courses, sections, departments, dows, time_range, color_map) {
    var ignoreStateChange;
    ignoreStateChange = false;
    return function(index, options) {
      var height, new_url, schedule, secs, section_id, state, timemap, _i, _len;
      options = $.extend({
        replace: false
      }, options);
      if (index >= schedules.length || index < 0 || ignoreStateChange) {
        return;
      }
      ignoreStateChange = true;
      schedule = schedules[index];
      timemap = create_timemap(schedule, sections, dows, time_range);
      secs = [];
      for (_i = 0, _len = schedule.length; _i < _len; _i++) {
        section_id = schedule[_i];
        secs.push(sections.get(section_id).to_hash());
      }
      current_schedule.selected_index = index;
      state = {
        offset: index + 1,
        schedule: response.result.id
      };
      new_url = format('{{ base }}{{ id }}/{{ offset }}/', {
        base: $('#schedules').attr('data-url-base'),
        id: state.schedule,
        offset: state.offset
      });
      if (options.replace) {
        History.replaceState(state, null, new_url);
      } else {
        History.pushState(state, null, new_url);
      }
      $('.thumbnail').removeClass('selected');
      $($('.thumbnail')[index]).addClass('selected');
      height = parseInt($('#schedule_template').attr('data-period-height'), 10);
      $('#schedules').html(templates.schedule_template({
        sid: index + 1,
        schedules: schedules,
        dows: response.result.days_of_the_week,
        timemap: timemap,
        time_range: response.result.time_range,
        color_map: color_map,
        courses: courses,
        sections: sections,
        departments: departments,
        crns: _.map(_.values(schedules[index]), function(sid) {
          return sections.get(sid).get('crn');
        }),
        displayTime: template_functions.display_time,
        pluralize: template_functions.pluralize,
        period_height: function(p) {
          return template_functions.period_height(p, height);
        },
        period_offset: function(p) {
          return template_functions.period_offset(p, height);
        },
        humanize_hour: function(h) {
          return new Time(h, 0, 0).format('{{ hour }} {{ apm }}');
        },
        humanize_time: function(time) {
          time = Time.parse_military(time);
          return time.format('{{ hour }}');
        }
      }));
      return ignoreStateChange = false;
    };
  };

  current_schedule = {};

  display_schedules = function(options) {
    var callback, target;
    options = $.extend({
      selected_index: 0,
      section_ids: null,
      id: null
    }, current_schedule, options);
    current_schedule = options;
    target = $('#thumbnails');
    callback = barrier(4, function() {
      var color_map, dows, height, i, schedule, schedules, secs, section_id, thumbnails_html, time_range, timemap, _i, _j, _len, _ref;
      if (!this.response.success) {
        Logger.error(this.response);
        return;
      }
      current_schedule.id = this.response.result.id;
      schedules = this.response.result.schedules;
      dows = this.response.result.days_of_the_week;
      time_range = this.response.result.time_range;
      if (schedules.length) {
        color_map = create_color_map(schedules[0], 8);
        thumbnails_html = [];
        for (i = _i = 0, _ref = schedules.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          schedule = schedules[i];
          timemap = create_timemap(schedule, this.sections, dows, time_range);
          secs = [];
          for (_j = 0, _len = schedule.length; _j < _len; _j++) {
            section_id = schedule[_j];
            secs.push(this.sections.get(section_id).to_hash());
          }
          height = parseInt($('#thumbnail_template').attr('data-period-height'), 10);
          thumbnails_html.push(templates.thumbnail_template({
            sid: i + 1,
            schedules: schedules,
            dows: this.response.result.days_of_the_week,
            timemap: timemap,
            time_range: this.response.result.time_range,
            color_map: color_map,
            courses: this.courses,
            sections: this.sections,
            period_height: function(p) {
              return template_functions.period_height(p, height);
            },
            period_offset: function(p) {
              return template_functions.period_offset(p, height);
            }
          }));
        }
        current_schedule.set_selected_index = create_set_index_for_schedule(schedules, this.response, this.courses, this.sections, this.departments, dows, time_range, color_map);
        current_schedule.set_selected_index(options.selected_index, {
          replace: true
        });
        target.html(thumbnails_html.join(''));
        bind_schedule_events();
        $('#schedule_thumbnail' + (options.selected_index + 1)).addClass('selected');
      } else {
        $('#schedules').html(templates.no_schedules_template());
      }
      if (schedules.length < 2) {
        return target.hide();
      }
    });
    api.courses(function(data) {
      return callback(function() {
        return this.courses = data;
      });
    });
    api.sections(function(data) {
      return callback(function() {
        return this.sections = data;
      });
    });
    api.departments(function(data) {
      return callback(function() {
        return this.departments = data;
      });
    });
    return api.schedules({
      section_ids: options.section_ids,
      id: options.id,
      success: function(r) {
        return callback(function() {
          return this.response = r;
        });
      }
    });
  };

  bind_schedule_events = function() {
    var KEY, hide_schedules;
    hide_schedules = function() {
      $('#thumbnails').hide(200);
      return false;
    };
    $('.view-schedules').live('click', function() {
      $('#thumbnails').toggle(200);
      return false;
    });
    $('#thumbnails .select-schedule').live('click', function() {
      var schedule_id;
      schedule_id = parseInt($(this).parent().attr('data-sid'), 10) - 1;
      current_schedule.set_selected_index(schedule_id);
      hide_schedules();
      return false;
    });
    KEY = {
      LEFT: 37,
      RIGHT: 39
    };
    $(window).bind('keyup', function(e) {
      var index;
      index = current_schedule.selected_index;
      if (e.keyCode === KEY.LEFT) {
        return current_schedule.set_selected_index(index - 1);
      } else if (e.keyCode === KEY.RIGHT) {
        return current_schedule.set_selected_index(index + 1);
      }
    });
    return window.current_schedule = current_schedule;
  };

  $(function() {
    var index, schedule_id, state, state_changed, target;
    target = $('#thumbnails');
    if (!target.length) {
      return;
    }
    if (History.enabled) {
      state_changed = function() {
        var state;
        state = History.getState();
        if (state.id) {
          return current_schedule.set_selected_index(state.data.offset - 1);
        }
      };
      History.Adapter.bind(window, 'statechange', state_changed);
      History.Adapter.bind(window, 'hashchange', state_changed);
    }
    state = History.getState();
    if (state.data.schedule) {
      index = state.data.offset || parseInt($('#schedules').attr('data-start'), 10) || 0;
      schedule_id = state.data.schedule || $('#schedules').attr('data-schedule');
    } else {
      index = parseInt($('#schedules').attr('data-start'), 10) || 0;
      schedule_id = $('#schedules').attr('data-schedule');
    }
    if (schedule_id === '') {
      schedule_id = null;
    }
    display_schedules({
      id: schedule_id,
      section_ids: selection.get_sections(),
      selected_index: Math.max(index - 1, 0)
    });
    return api.schedules({
      id: schedule_id,
      section_ids: selection.get_sections(),
      success: function(data) {
        var $el, current_sids, href, is_equal;
        current_sids = data.result.section_ids;
        is_equal = _.difference(current_sids, selection.get_sections()).length === 0;
        if (!is_equal) {
          $el = $('.selected_courses.button');
          href = $el.attr('href');
          if (href.indexOf('/selected/') === href.length - '/selected/'.length) {
            return $el.attr('href', href + data.result.id + '/');
          }
        }
      }
    });
  });

}).call(this);
