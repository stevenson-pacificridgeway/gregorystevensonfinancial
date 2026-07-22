/* Site-wide lead capture -> RidgeCRM (Follow Up Boss)
   Auto-wires any lead form on the page: on submit it POSTs the lead as JSON,
   shows a thank-you on success, and falls back to the form's existing behavior
   on failure so no lead is ever lost. Add new forms freely; they wire automatically. */
(function(){
  var ENDPOINT = 'https://ridgecrm-production.up.railway.app/api/website-lead';
  function sourceFor(form){
    return form.getAttribute("data-source") || window.__LEAD_SOURCE__ || (location.hostname + location.pathname);
  }

  function val(form, names){
    for(var i=0;i<names.length;i++){
      var el = form.querySelector('[name="'+names[i]+'"]');
      if(el && el.value != null && String(el.value).trim() !== '') return String(el.value).trim();
    }
    return '';
  }
  function isLeadForm(form){
    return !!form.querySelector('[type="email"],[type="tel"],[name="email"],[name="phone"],[name="name"],[name="fullname"],[name="full_name"],[name="first_name"]');
  }
  function showThankYou(form){
    var box = document.createElement('div');
    box.className = 'lead-thankyou';
    box.setAttribute('role','status');
    box.style.cssText = 'padding:20px 22px;border-radius:16px;background:rgba(198,162,76,.14);border:1px solid rgba(230,207,140,.5);color:#f4f1e8;text-align:center;font-family:inherit;';
    box.innerHTML = '<div style="font-weight:700;font-size:18px;margin-bottom:4px;">Thank you!</div><div style="color:#cdc8e2;font-size:14px;">We have received your request and Gregory\'s office will be in touch shortly.</div>';
    form.parentNode.insertBefore(box, form);
    form.style.display = 'none';
  }
  function fallback(form){
    var action = form.getAttribute('action');
    if(action && action !== '#'){ form.submit(); return; }
    var box = document.createElement('div');
    box.className = 'lead-error';
    box.setAttribute('role','alert');
    box.style.cssText = 'padding:14px 18px;border-radius:14px;background:rgba(226,75,74,.12);border:1px solid rgba(226,75,74,.4);color:#f4f1e8;font-size:14px;margin-bottom:12px;';
    box.innerHTML = 'We could not submit that just now. Please email stevenson@pacificridgewayinsurance.com or book a time directly below. Your details are safe.';
    form.parentNode.insertBefore(box, form);
  }
  function wire(form){
    if(form.__leadWired) return; form.__leadWired = true;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = val(form,['name','fullname','full_name','first_name','fname']);
      var last = val(form,['last_name','lname']);
      if(last) name = (name + ' ' + last).trim();
      var payload = {
        name: name,
        email: val(form,['email']),
        phone: val(form,['phone','tel','mobile','phone_number']),
        source: sourceFor(form),
        message: val(form,['message','comments','notes','concern','primary_concern','question'])
      };
      var btn = form.querySelector('[type="submit"]') || form.querySelector('button');
      var orig = btn ? btn.textContent : '';
      if(btn){ btn.disabled = true; btn.textContent = 'Sending...'; }
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      .then(function(r){ if(!r.ok) throw new Error('status ' + r.status); return r; })
      .then(function(){ showThankYou(form); })
      .catch(function(){ if(btn){ btn.disabled = false; btn.textContent = orig; } fallback(form); });
    });
  }
  function scan(){
    var forms = document.querySelectorAll('form');
    for(var i=0;i<forms.length;i++){ if(isLeadForm(forms[i])) wire(forms[i]); }
  }
  if(document.readyState !== 'loading') scan();
  else document.addEventListener('DOMContentLoaded', scan);
  try{ new MutationObserver(scan).observe(document.documentElement, {childList:true, subtree:true}); }catch(e){}
})();
