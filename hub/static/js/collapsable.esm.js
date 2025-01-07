import $ from 'jquery/dist/jquery.slim'
import Collapse from 'bootstrap/js/dist/collapse'

const setUpCollapsable = function(targets, triggers, triggerEvents, showTest) {
    var instances = [];
    var $targets = $(targets); // targets can either be a jQuery object or selector(s)
    var $triggers = $(triggers); // triggers can either be a jQuery object or selector(s)

    var updateUI = function() {
        var show = showTest($targets, $triggers);
        $.each(instances, function(i, instance){
            show ? instance.show() : instance.hide();
        });
    };

    $targets.addClass('collapse').each(function(){
        instances.push(new Collapse(this, { toggle: false}));
    });

    $triggers.on(triggerEvents, function(){
        updateUI();
    });

    updateUI();
}

export default setUpCollapsable
