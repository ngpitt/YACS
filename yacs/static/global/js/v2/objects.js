//////////////////////////////// Class object ////////////////////////////////
// Based on john resig's simple javascript inheritance
(function($, undefined){
var root = this;
var initializing = false;

root.Class = function (){};
root.Class.extend = function(attributes){
  var _super = this.prototype;

  initializing = true;
  var prototype = new this;
  initializing = false;

  // copy attributes over to the new class
  for (var name in attributes){
    prototype[name] = ($.isFunction(_super[name]) && $.isFunction(attributes[name])) ?
  (function(name, fn){
    return function(){
      var tmp = this._super;
      this._super = _super[name];
      var ret = fn.apply(this, arguments);
      this._super = tmp;
      return ret;
    };
  })(name, attributes[name]) :
    attributes[name];
  }

  function Class(){
    if (!initializing && this.init)
      this.init.apply(this, arguments);
  };
  Class.prototype = prototype;
  Class.prototype.constructor = Class;
  Class.extend = arguments.callee;
  return Class;
};

//////////////////////////////// Utility functions ////////////////////////////////
root.Utils = {
  time: function(fn, context, msg){
    var start = new Date;
    var result = fn.call(context || this);
    var diff = new Date - start;
    console.log('time', diff, msg || '');
    return result;
  },
  integer: function(i){ return parseInt(i, 10); },
  getCookie: function(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  },
  CSRFToken: function(){
    return Utils.getCookie('csrftoken');
  },
  sendMessage: function(obj, method, args){
    return obj && obj[method] && $.isFunction(obj[method]) && obj[method].apply(obj, args || []);
  },
  property: function(name){
    return function(obj){ return obj[name]; };
  }
}

})(jQuery);

//////////////////////////////// Core functions ////////////////////////////////
function assert(bool, message){
  if (!bool) throw message || "Assertion failed";
}

///////////////////////////////////////////////////
// global hooks

// modify ajax requests to use csrf token for local POST requests
// taken from https://docs.djangoproject.com/en/dev/ref/contrib/csrf/
$(document).ajaxSend(function(event, xhr, settings) {
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", Utils.CSRFToken());
    }
});

//////////////////////////////// Extensions ////////////////////////////////
// yes, not portable. But this is an app. I get to do whatever I want!
$.extend(Function.prototype, {
    // Returns a function with specified function context
    bind: function(obj){
        return (function(self){
            return function(){ return self.apply(obj, arguments); };
        })(this);
    },
    // function composition
    comp: function(){
      return (function(self, args){
        var a = args.slice(0); // clone() isn't defined yet
        return function(){ return self.apply(this, a.pushArray(arguments)); }
      })(this, _.toArray(arguments));
    }
});


$.extend(jQuery.fn, {
  checked: function(){
    var checkboxes = this.filter('input[type=checkbox], input[type=radio]');
    if (arguments.length < 1)
      return checkboxes.attr('checked') !== undefined;
    else
      (arguments[0] ? checkboxes.attr('checked', 'checked') : checkboxes.removeAttr('checked'));
    return this;
  }
});

$.extend(String.prototype, {
    contains: function(str){ return this.indexOf(str) >= 0; },
    format: function(){
      if (arguments.length < 1)
        return this;
      // process like named argument (names pair up with object properties)
      if (arguments.length === 1 && $.type(arguments[0]) === 'object'){
        var obj = arguments[0];
        return this.replace(/{{ *([a-zA-Z0-9_-]+) *}}/g, function(match, identifer){
          return typeof obj[identifer] !== 'undefined' ? obj[identifer] : match;
        });
      }
      // process as numbered arguments (names pair up with argument indices)
      var args = arguments;
      return this.replace(/{{ *(\d+) *}}/g, function(match, index){
        return typeof args[index] !== 'undefined' ? args[index] : match;
      });
    },
    isBlank: function(){
      return this.trim() === '';
    },
    startsWith: function(str){
        return this.indexOf(str) === 0;
    },
    endsWith: function(str){
        return this.indexOf(str) === this.length - str.length;
    },
    trim: function(){
        return $.trim(this);
    }
});

$.extend(Array.prototype, {
    clone: Array.prototype.slice,
    compact: function(){ return _.compact(this); },
    contains: function(value){ return _.contains(this, value); },
    each: function(fn){
      for(var i=0, l=this.length; i<l; i++){
        var ret = fn.call(this[i], this[i], i);
        if (ret === 'continue') continue;
        if (ret === 'break') break;
      }
      return this;
    },
    // like each, except performs operations asynchronously
    // returns an array of all the timers.
    // Normal break & continue mechanisms do not work with this.
    asyncEach: function(fn, options){
      var opt = $.extend({
        delay: 10
      }, options);
      var accum = [];
      for(var i=0, l=this.length; i<l; i++){
        accum.push(setTimeout((function(value, index){
          return function(){ fn.call(value, value, index); };
        })(this[i], i), opt.delay * i));
      }
      return accum;
    },
    map: function(fn){ return _.map(this, fn); },
    reduce: function(fn, initial){ return _.reduce(this, fn, initial); },
    all: function(fn){
      for(var i=0, l=this.length; i<l; i++){
        if(!fn(this[i], fn))
          return false;
      }
      return true;
    },
    some: function(fn){
      for(var i=0, l=this.length; i<l; i++){
        if(fn(this[i], fn))
          return true;
      }
      return false;
    },
    filter: function(fn, context){
      return _.filter(this, function(value, i){
        return fn.call(this, value, i);
      }, context || this);
    },
    pushUnique: function(value){
      if (!this.contains(value))
        return this.push(value) || true;
      return false;
    },
    pushArray: function(arr){
      for(var i=0, l=arr.length; i<l; i++)
        this.push(arr[i]);
      return this;
    },
    unique: function(){
      var items = this.slice(0);
      items.sort();
      var prev = undefined;
      for (var i=items.length - 1; i>= 0; i--){
        if(prev === items[i])
          items.splice(i, 1);
        prev = items[i];
      }
      return items;
    },
    excludeFrom: function(items){
      var items = items.unique();
      return this.unique().filter(function(val){
        return !items.contains(val);
      });
    },
    removeItem: function(value){
      var success = false;
      for(var i=this.length-1; i>=0; i--){
        if (this[i] === value){
          this.splice(i, 1);
          success = true;
        }
      }
      return success;
    }
});

//////////////////////////////// Helper Objects ////////////////////////////////
var DelayedInvocation = function(fn, options){
  var context = this;
  var timer = null;
  var opt = $.extend({
    delay: 200,
    cancelled: function(){}
  }, options);
  var stop = function(){
    if (timer){
      clearTimeout(timer);
      opt.cancelled.call(context);
    }
    timer = null;
  };
  var invocation = function(){
    timer = setTimeout(function(){
      fn.call(this, arguments);
    }, opt.delay);
  };
  invocation.abort = invocation.stop = stop;
  return invocation;
};

// handles the associated events for showing activity indicators
// to the user (aka - we're busy doing something)
var ActivityResponder = Class.extend({
  options: {
    show: null,
    hide: null
  },
  _currentState: false,
  init: function(options){
    $.extend(this.options, options);
  },
  _show: function(){
    $.isFunction(this.options.show) ? this.options.show() : $.noop();
  },
  _hide: function(){
    $.isFunction(this.options.hide) ? this.options.hide() : $.noop();
  },
  show: function(){
    if (this._currentState) return;
    this._show();
    this._currentState = true;
    return this;
  },
  hide: function(){
    if (!this._currentState) return;
    this._hide();
    this._currentState = false;
    return this;
  },
  setVisibility: function(value){
    value ? this.show() : this.hide();
    return this;
  },
  isVisible: function(){ return this._currentState; }
});


// Simply stores it into memory, not persistent
var MemoryStore = Class.extend({
  init: function(container){
    this.container = container;
  },
  setItem: function(key, string){ this.container[key] = string; },
  getItem: function(key){ console.log(key); return this.container[key]; },
  removeItem: function(key){
    var value = this.container[key];
    delete this.container[key];
    return value;
  },
});

// Provides a basic abstraction layer from the storage system
// Keys can only be strings and values have to be serializable.
// The default serialize & deserialize functions are JSON.stringify
// and $.parseJSON.
//
// This base implementation uses localStorage when possible and
// falls back to sessionStorage. Due to the extra library,
// all grade-A browsers (as defined by YUI), should support
// sessionStorage.
//
// Using this class should be considered a slow operation.
var Storage = Class.extend({
  options: {
    autoload: true,
    keyFormat: 'net.jeffhui.{{ type }}.{{ key }}',
    serialize: JSON.stringify,
    store: null,
    deserialize: $.parseJSON
  },
  keys: [],
  init: function(options){
    $.extend(this.options, options);
    if (this.options.autoload) this.load();
  },
  _getStore: function(){
    if (this.options.store) return this.options.store;
    if (window.localStorage) return window.localStorage;
    return window.sessionStorage;
  },
  _set: function(key, string){ this._getStore().setItem(key, string); },
  _get: function(key){ return this._getStore().getItem(key); },
  _remove: function(key){ return this._getStore().removeItem(key); },
  _deserialize: function(string){ return this.options.deserialize(string); },
  _serialize: function(obj){ return this.options.serialize(obj); },
  _save: function(){
    // save internal information to storage
    this._set(this._getFullKey('keys', {isPrivate: true}), this.keys);
  },
  load: function(){
    var raw = this._get(this._getFullKey('keys', {isPrivate: true}));
    try {
      this.keys = this._deserialize(raw);
    } catch (error) {
      this.keys = [];
    }
  },
  _getFullKey: function(key, options){
    // private is used to indicate properties set used
    // by this storage system
    var opt = $.extend({
      isPrivate: false
    }, options);

    return this.options.keyFormat.format({
      type: opt.isPrivate ? 'private' : 'public',
      key: key
    });
  },
  set: function(key, value){
    assert($.type(key) === 'string', 'key must be a string.');
    var fullKey = this._getFullKey(key);
    this._set(fullKey, this._serialize(value));
    if(!this.keys)
      this.keys = [];
    this.keys.pushUnique(key);
    this._save();
  },
  get: function(key){
    assert($.type(key) === 'string', 'key must be a string.');
    var fullKey = this._getFullKey(key);
    return this._deserialize(this._get(fullKey));
  },
  contains: function(key){ return this.keys.contains(key); },
  clear: function(){
    var self = this;
    this.keys.each(function(key){
      var fullKey = self._getFullKey(key);
      self._remove(fullKey);
    });
    this._save();
  }
});


function templateFromElement(selector, data){
  return _.template($(selector).html(), data);
}
var Template = Class.extend({
  options: {
    string: null,
    selector: null,
    context: null
  },
  init: function(options){
    this.options = $.extend({}, this.options, options || {});
    assert(this.options.string || this.options.selector, 'string or selector option must be given.');
  },
  extendContext: function(context){
    this.options.context = $.extend({}, this.options.context || {}, context || {});
    return this;
  },
  _getContext: function(context){
    return $.extend({}, this.options.context, context || {});
  },
  _getString: function(){
    return this.options.string || $(this.options.selector).html();
  },
  render: function(context){
    var data = this._getContext(context);
    return _.template(this._getString(), data);
  },
  renderTo: function(element, context){
    $(element).html(this.render(context));
  }
});

//////////////////////////////// Models ////////////////////////////////
ModelBase = Backbone.Model.extend({
  parse: function(response){ return response.payload; }
});

var Semester = ModelBase.extend({
  urlRoot: '/api/2/'
});

var Period = ModelBase.extend({ });

var Section = ModelBase.extend({
  urlRoot: '/api/2/latest/sections/',
  getPeriods: function(){
    return new PeriodList(this.get('periods'));
  },
  getInstructors: function(){
    return this.getPeriods().pluck('instructor');
  },
  getKinds: function(){
    return this.getPeriods().pluck('kind');
  }
});

var Course = ModelBase.extend({
  urlRoot: '/api/2/latest/courses/',
  getSections: function(){
    var sortedSections = _.sortBy(this.get('sections'), function(section){ 
      return section.number;
    });
    return new SectionList(sortedSections);
  },
  getSeatsTotal: function(){
    return this.getSections().reduce(function(a, b){
      return a + b.get('seats_total');
    }, 0);
  },
  getSeatsLeft: function(){
    return this.getSections().reduce(function(a, b){
      return a + b.get('seats_left');
    }, 0);
  },
  getSeatsTaken: function(){
    return this.getSections().reduce(function(a, b){
      return a + b.get('seats_taken');
    }, 0);
  },
  //
  getCRNs: function(){
    return this.getSections().pluck('crn').unique();
  },
  getFullCRNs: function(){
    var sections = this.getSections();
    sections = sections.filter(function(section){
      return section.get('seats_left') <= 0;
    });
    return _.pluck(sections, 'crn').unique();
  },
  getKinds: function(){
    return this.getSections().reduce(function(kinds, section){
      section.getKinds().each(function(kind){
        kinds.push(kind);
      });
      return kinds;
    }, []).unique();
  },
  getNotes: function(){
    return this.getSections().reduce(function(notes, section){
      section.get('notes').each(function(note){
        notes.push(note);
      });
      return notes;
    }, []).unique();
  },
  getCreditsDisplay: function(){
    var min_credits = this.get('min_credits'),
      max_credits = this.get('max_credits');
    return (min_credits === max_credits ?
        '{{ 0 }} credit{{ 1 }}'.format(min_credits, min_credits === 1 ? '' : 's') :
        '{{ 0 }} - {{ 1 }} credits'.format(min_credits, max_credits));
  }
});

var Schedule = ModelBase.extend({
  url: function(){ return $('#schedules').attr('data-source'); },
  getCourseIDs: function(){ return _.keys(this.get('mapping')); },
  getCRNs: function(){ return _.values(this.get('mapping')); },
  getCRNsForCourseID: function(cid){ return this.get('mapping')[cid]; }
});

// TODO: implement
var SectionConflict = ModelBase.extend({
  urlRoot: '/api/2/latest/section-conflicts/'
});

//////////////////////////////// Collections ////////////////////////////////
var CollectionBase = Backbone.Collection.extend({
  reload: function(){
    this.each(function(model){ model.fetch(); });
  }
});

var SemesterList = CollectionBase.extend({
  model: Semester,
  url: '/api/2/'
});

var PeriodList = CollectionBase.extend({
  model: Period,
});

var SectionList = CollectionBase.extend({
  model: Section,
  url: '/api/2/latest/sections'
});

var CourseList = CollectionBase.extend({
  model: Course,
  url: '/api/2/latest/courses/'
});

/*
var ScheduleList = CollectionBase.extend({
  model: Schedule,
  url: '/api/2/latest/
});
*/

// represents a mapping of course id => crns
var Selection = Class.extend({
  options: {
    course_id_format: 'selected_course_{{ cid }}',
    section_id_format: 'selected_course_{{ cid }}_{{ crn }}',
    checkbox_selector: '.course input[type=checkbox]',
    storage: new Storage(),
    storageKey: 'crns',
    autoload: true
  },
  init: function(options){
    this.crns = {};
    this.options = $.extend({}, this.options, options);
    if(this.options.autoload)
      this.load();
  },
  // returns object of course data
  _processCourseElement: function(el){
    var $el = $(el);
    var isNotBlank = function(s){ return !s.isBlank(); };
    return {
      id: Utils.integer($el.attr('data-cid')),
      CRNs: $el.attr('data-crns').split(',').filter(isNotBlank).map(Utils.integer),
      fullCRNs: $el.attr('data-crns-full').split(',').filter(isNotBlank).map(Utils.integer)
    };
  },
  // returns an object for section data
  _processSectionElement: function(el){
    var $el = $(el);
    return {
      course_id: Utils.integer($el.attr('data-cid')),
      crn: Utils.integer($el.attr('data-crn'))
    };
  },
  _trigger: function(names, obj){
    var $self = $(this);
    for(var i=0, l=names.length; i<l; i++)
      $self.trigger(names[i], $.extend(obj, {sender: this}));
  },
  _isCourseElement: function(el){ return $(el).attr('data-crns-full') !== undefined; },
  _add: function(course_id, crn){
    this.crns[course_id] || (this.crns[course_id] = []);
    if (!this.crns[course_id].pushUnique(crn)) return false;
    this._trigger(['changed', 'changed:item'], {type: 'added', cid: course_id, crn: crn});
    return true;
  },
  addCourse: function(course_elem){
    var obj = this._processCourseElement(course_elem),
      crns = obj.CRNs.excludeFrom(obj.fullCRNs),
      added = false;
    for (var i=0, l=crns.length; i<l; i++)
      added = this._add(obj.id, crns[i]) || added;
    // if none were added (because all were full), explicitly add all sections
    if (!added){
      for (var i=0, l=obj.CRNs.length; i<l; i++)
        this._add(obj.id, obj.CRNs[i]);
    }
    this._trigger(['added', 'added:course'], {type: 'course', cid: obj.course_id});
    return added;
  },
  addSection: function(section_elem){
    var obj = this._processSectionElement(section_elem);
    var result = this._add(obj.course_id, obj.crn);
    this._trigger(['added', 'added:section'], {type: 'section', cid: obj.course_id, crn: obj.crn});
    return result;
  },
  add: function(course_or_section_elem){
    if (this._isCourseElement(course_or_section_elem))
      this.addCourse(course_or_section_elem);
    else
      this.addSection(course_or_section_elem);
  },
  containsCourseID: function(course_id){ return this.getCourseIds().contains(course_id); },
  containsCRN: function(crn){
    var contained = false;
    _.values(this.crns).each(function(crns){
      if(crns.contains(crn)){
        contained = true;
        return 'break';
      }
    });
    return contained;
  },
  _remove: function(course_id, crn){
    if (!(this.crns[course_id] && this.crns[course_id].removeItem(crn))) return;
    if (!this.crns[course_id].length)
      delete this.crns[course_id];
    this._trigger(['changed', 'changed:item'], {type: 'removed', cid: course_id, crn: crn});
  },
  removeCourse: function(course_elem){
    var obj = this._processCourseElement(course_elem);
    for (var i=0, l=obj.CRNs.length; i<l; i++)
      this._remove(obj.id, obj.CRNs[i]);
    this._trigger(['removed', 'removed:course'], {type: 'course', cid: obj.course_id});
  },
  removeSection: function(section_elem){
    var obj = this._processSectionElement(section_elem);
    this._remove(obj.course_id, obj.crn);
    this._trigger(['removed', 'removed:section'], {type: 'section', cid: obj.course_id, crn: obj.crn});
  },
  remove: function(course_or_section_elem){
    if (this._isCourseElement(course_or_section_elem))
      this.removeCourse(course_or_section_elem);
    else
      this.removeSection(course_or_section_elem);
  },
  toQueryString: function(){
    var parameters = {};
    var self = this;
    $.each(this.crns, function(cid, crns){
      parameters[self.options.course_id_format.format({cid: cid})] = "checked";
      crns.each(function(crn){
        parameters[self.options.section_id_format.format({cid: cid, crn: crn})] = "checked";
      });
    });
    return parameters;
  },
  save: function(){
    assert(this.options.storage, 'Storage must be defined in options to save');
    this.options.storage.set(this.options.storageKey, this.crns);
    this._trigger(['save'], this);
  },
  load: function(){
    assert(this.options.storage, 'Storage must be defined in options to load');
    this.set(this.options.storage.get(this.options.storageKey) || {});
    this._trigger(['load'], this);
    return this;
  },
  clear: function(){
    this.set({});
    this.save();
  },
  set: function(selected_crns){
    this.crns = $.extend({}, selected_crns);
    return this;
  },
  getCourseIds: function(){
    return _.keys(this.crns).map(Utils.integer);
  },
  getCRNs: function(){
    return _.reduce(this.crns, function(crns, courseCRNs){
      courseCRNs.each(function(crn){
        crns.push(crn);
      });
      return crns;
    }, []).map(Utils.integer).unique();
  },
  _getCourseElem: function(course_id){
    return $('#' + this.options.course_id_format.format({cid: course_id}));
  },
  _getSectionElem: function(course_id, crn){
    return $('#' + this.options.section_id_format.format({cid: course_id, crn: crn}));
  },
  refresh: function(){
    // update DOM to reflect selection
    $(this.options.checkbox_selector).checked(false); // this can be a bottleneck if there's enough elements
    var self = this;
    this.getCourseIds().each(function(cid){
      var crns = self.crns[cid];
      if (crns && crns.length){
        var $course = self._getCourseElem(cid).checked(true);
        self.crns[cid].each(function(crn){
          self._getSectionElem(cid, crn).checked(true);
        });
      }
    });
  }
});

//////////////////////////////// Views ////////////////////////////////
var TemplateView = Backbone.View.extend({
  context: {},
  templateSelector: null,
  getContext: function(){
    return this.context;
  },
  templateFromSelector: function(selector){
    return new Template({selector: selector});
  },
  getTemplate: function(){
    return this.templateFromSelector(this.templateSelector);
  },
  onRender: function(){
  },
  render: function(){
    this.onRender();
    $(this.el).html(this.getTemplate().render(this.getContext()));
    return this;
  }
});

var TooManyCRNsView = TemplateView.extend({
  templateSelector: '#too-many-crns-template'
});

var NoSchedulesView = TemplateView.extend({
  templateSelector: '#thumbnail-template'
});

var BaseScheduleView = TemplateView.extend({
  insertionType: 'replaceWith',
  initialize: function(options){
    this.scheduleIndex = options.scheduleIndex || 0;
    this.period_height = parseInt($(this.templateSelector).attr('data-period-height'), 10)
  },
  getScheduleIndex: function(){ return this.scheduleIndex; },
  setScheduleIndex: function(index){
    var old = index;
    this.scheduleIndex = index || 0;
    $(this).trigger({
      type:'scheduleIndexChanged',
      sender: this,
      index: this.scheduleIndex,
      oldIndex: old
    })
    return this;
  },
  getContext: function(){
    var json = this.options.json,
      FC = FunctionsContext,
      self = this,
      context = {
        color_map: FC.create_color_map(json.schedules[0]),
        get_period_height: function(period){
          return FC.get_period_height(period, self.period_height);
        },
        get_period_offset: function(period){
          return FC.get_period_offset(period, self.period_height);
        },
        sid: Utils.integer(_.keys(json.schedules)[self.scheduleIndex]) + 1,
        schedule: json.schedules[self.scheduleIndex],
      };
    return $.extend({}, json, FC, context);
  }
});

var ThumbnailView = BaseScheduleView.extend({
  events: {
    'click .select-schedule': 'selectSchedule'
  },
  templateSelector: '#thumbnail-template',
  onRender: function(){
    $(this.el).attr({
      id: "schedule_thumbnail" + this.scheduleIndex,
      'class': "schedule_wrapper thumbnail",
      'data-sid': "" + this.scheduleIndex
    });
  },
  selectSchedule: function(){
    var scheduleView = this.options.scheduleView;
    $('#schedule_thumbnail' + scheduleView.getScheduleIndex()).removeClass('selected');
    scheduleView.setScheduleIndex(this.scheduleIndex).render().hideThumbnails();
    $(this.el).addClass('selected');
    return false;
  }
});

var ScheduleView = BaseScheduleView.extend({
  events: {
    'click .view-schedules': 'toggleThumbnails'
  },
  templateSelector: '#schedule-template',
  animationDuration: 300,
  onRender: function(){
    this.$thumbnails = $(this.options.thumbnailsContainerEl);
  },
  hideThumbnails: function(){
    this.$thumbnails.slideUp(this.animationDuration);
  },
  showThumbnails: function(){
    this.$thumbnails.slideDown(this.animationDuration);
  },
  areThumbnailsVisible: function(){ return this.$thumbnails.is(':visible'); },
  toggleThumbnails: function(){
    if (this.areThumbnailsVisible())
      this.hideThumbnails();
    else
      this.showThumbnails();
    return false;
  }
});


var CourseListView = Backbone.View.extend({
  beingRemoved: false,
  initialize: function(options){
    this.options.dows = options.dows || 'Monday Tuesday Wednesday Thursday Friday'.split(' ');
    this.options.isReadOnly = options.isReadOnly || false;
    if (options.selected)
      this.setSelection(options.selected);
  },
  setSelection: function(selection){
    this.options.selected = selection;
    var courses = this.options.selected.getCourseIds();
    if(!courses) return;
    this.collection = new CourseList();
    var self = this;
    courses.each(function(course_id){
      if (self.beingRemoved) return;
      var c = new Course({id: course_id});
      c.fetch();
      self.collection.add(c, {slient: true});
    });
    // don't receive change events until all the models have been fetched.
    var left = courses.length;
    this.collection.bind('change', function(){
      if (self.beingRemoved) return;
      if (--left <= 0){
        self.render();
        left = 0;
      }
    });
    if (!courses.length)
      self.render();
  },
  render: function(){
    var $target = $(this.el).empty(),
      tmpl = this.options.template || templateFromElement('#course-template'),
      noneTmpl = this.options.emptyTemplate || templateFromElement('#no-courses-template');
    if (!this.collection.length){
      $target.html(noneTmpl());
      return this;
    }

    var self = this;
    this.collection.each(function(id){
      var course = self.collection.get(id);
      if (course.isNew()) return;
      var sections = course.sections;
      var context = {
        alwaysShowSections: true,
        days_of_the_week: self.options.dows,
        periodsByDayOfWeek: function(periods){
          var remapped_periods = {};
          self.options.dows.each(function(dow){
            remapped_periods[dow] = [];
          });
          _.toArray(periods).each(function(period){
            period.days_of_the_week.each(function(dow){
              remapped_periods[dow].push(period);
            });
          });
          return remapped_periods;
        },
        isSelectedCRN: function(crn){
          return self.options.selected.containsCRN(crn);
        },
        displayPeriod: function(p){
          var fmt = '{{ 0 }}-{{ 1 }}',
            start = FunctionsContext.time_parts(p.start_time),
            end = FunctionsContext.time_parts(p.end_time)
          return fmt.format(
            FunctionsContext.humanize_time(p.start_time, {includesAPM: false}),
            FunctionsContext.humanize_time(p.end_time)
          );
        },
        isReadOnly: self.options.isReadOnly,
        course: course
      };
      $target.append(tmpl(context));
    });
    return this;
  }
});

//////////////////////////////// Realtime Search ////////////////////////////////

var RealtimeForm = Class.extend({
    options: {
        updateElement: $(),
        success: function(value){ this.html(value); },
        error: function(){ console.error('failed realtime form:', arguments); },
        complete: $.noop,
        activityResponder: null,
        dataType: undefined,
        url: null,
        method: null,
        cache: false,
        additionalPOST: '',
        additionalGET: '',
        triggerDelay: 200,
        customHandler: null
    },
    init: function(form, options){
        this.options = $.extend({}, this.options, options);
        this.form = $(form);
        this.callback = DelayedInvocation(this.sendRequest.bind(this), {
            delay: this.options.triggerDelay,
            cancelled: this.stopRequest.bind(this)
        });
        this.attachEvents();
        this._previousValue = this.getMethodData();
    },
    _asQueryString: function(obj){
      var type = $.type(obj);
      if (type === 'object')
        return $.param(obj);
      if (type === 'string')
        return obj
      return String(obj);
    },
    getURL: function(){
      var base = this.options['url'] || this.form.attr('action'),
          postfix = base.contains('?') ? '&' : '?',
          querystr = this.getFormMethod() !== 'GET' ? this._asQueryString(this.options.additionalGET) : '';
      return base + (querystr.isBlank() ? '' : postfix + querystr);
    },
    getFormMethod: function(){
      var m = this.form.attr('method');
      return m && m.toUpperCase();
    },
    getMethod: function(){
      return (this.options['method'] || this.getFormMethod()).toUpperCase();
    },
    getMethodData: function(){
        var formMethod = this.form.attr('method').toUpperCase(),
            type = this.getMethod().toUpperCase();
        if(['GET', 'POST'].contains(type)){
            var data = (type == formMethod ? this.form.serialize() : ''),
              params = {
                GET: this.options.additionalGET,
                POST: this.options.additionalPOST
              }[type];
            var paramsType = typeof params;
            if (paramsType === 'object')
              return data + '&' + $.param(params);
            if (paramsType === 'string' && !params.isBlank())
              return data + '&' + params;
            return data;
        } else throw "Invalid method type";
    },
    stopRequest: function(){
        if(this.request){
            this.request.abort();
            this.request = null;
        }
    },
    sendRequest: function(){
        var self = this;
        console.log('send', this.getURL(), this.getMethodData());
        self.request = $.ajax({
            url: this.getURL(),
            type: this.getMethod(),
            data: this.getMethodData(),
            dataType: this.options.dataType,
            cache: this.options.cache,
            success: function(){
                var $el = $(self.options.updateElement);
                self.options.success.apply($el, arguments);
            },
            error: function(){
                self.options.error.apply(this, arguments);
            },
            complete: function(){
                self.request = null;
                self.options.complete.apply(self, arguments);
                self.hideActivityIndicator();
            }
        });
    },
    initiateRequest: function(){
        this.showActivityIndicator();
        // call custom hook which can override the default behavior if necessary
        if (this.options.customHandler){
            if (this.options.customHandler(this.form, this.callback))
                this.hideActivityIndicator();
        } else {
            this.callback();
        }
    },
    changed: function(evt){
        var newValue = this.getMethodData();
        if (this._previousValue !== newValue){
          this.initiateRequest();
          this._previousValue = newValue;
        }
        return false;
    },
    showActivityIndicator: function(){
      Utils.sendMessage(this.options.activityResponder, 'show');
    },
    hideActivityIndicator: function(){
      Utils.sendMessage(this.options.activityResponder, 'hide');
    },
    keyDownSelector: 'input[type=text], input[type=search], textarea',
    detachEvents: function(){
        if (this._changed){
            var self = this;
            this.form.find('input, textarea, select').each(function(){
                var $el = $(this);
                if ($el.is(self.keyDownSelector))
                    $el.unbind('keyup', self._changed);
                //$el.unbind('change', self._changed);
            });
        }
    },
    attachEvents: function(){
        this.detachEvents();
        var self = this;
        this._changed = this.changed.bind(this);
        this.form.find('input, textarea, select').each(function(){
            var $el = $(this);
            if ($el.is(self.keyDownSelector))
                $el.keyup(self._changed);
            if ($el.is('input[type=search]'))
                $el.bind('search', self._changed);
            //$el.bind('change', self._changed);
        });
    }
});

//////////////////////////////// Scheduling ////////////////////////////////

var FunctionsContext = {
  time_parts: function(timestr){
    var parts = timestr.split(':'), // hour:min:sec
      i = Utils.integer;
    return {
      hour: i(parts[0]),
      minute: i(parts[1]),
      second: i(parts[2])
    };
  },
  time_to_seconds: function(timestr){
    var parts = FunctionsContext.time_parts(timestr); // hour:min:sec
    return parts.hour * 3600 + parts.minute * 60 + parts.second;
  },
  get_crns: _.values,
  create_color_map: function(schedule, maxcolors){
    var color_map = {},
      maxcolors = maxcolors || 9;
    _.keys(schedule).each(function(cid, i){
      color_map[cid] = (i % maxcolors) + 1;
    });
    return color_map;
  },
  humanize_time: function(timestr, options){
    options = $.extend({
      includesAPM: true
    }, options);
    var parts = timestr.split(':'),
        hour = parseInt(parts[0], 10),
        minutes = parseInt(parts[1], 10),
        apm = 'AM';
    if (hour === 0){
      hour = 12;
    } else if (hour > 12){
      apm = 'PM';
      hour = hour - 12;
    } else if (hour === 12){
      apm = 'PM';
    }
    if (!options.includesAPM)
      apm = '';
    if (minutes !== 0)
      return hour + ":" + (minutes < 10 ? '0' : '') + minutes + apm;
    return hour + apm;
  },
  humanize_hour: function(hour){
    var apm = 'am';
    if (hour == 0) hour = 12;
    else if (hour >= 12) apm = 'pm';
    if (hour > 12) hour = hour - 12;
    return hour + " " + apm;
  },
  get_period_offset: function(period, height){
    var start = FunctionsContext.time_parts(period.start_time),
        time = start.minute * 60 + start.second;
    return time / 3600.0 * height;
  },
  get_period_height: function(period, height){
    var time_to_seconds = FunctionsContext.time_to_seconds;
    var time = time_to_seconds(period.end_time) - time_to_seconds(period.start_time);
    //return 25 // 30 min time block
    //return 41.666666667 // 50 min time block
    return time / 3600.0 * height;
  }
};

