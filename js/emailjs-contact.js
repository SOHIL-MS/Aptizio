/**
 * EmailJS: public key only (never put your private key in client code).
 * IDs: js/emailjs-ids.js → window.APTIZIO_EMAILJS.serviceId / templateId
 *
 * mailto fallback: does not work from editor “simple browser” / iframe previews.
 * Open the site in Chrome or Edge (file or http), or use EmailJS for in-page send.
 */
(function () {
  var EMAILJS_PUBLIC_KEY = "ExE9P3sJkzDd4N7Lr";
  var MAILTO = "info@aptizio.in";
  var emailjsInitialized = false;

  function inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  function fillTimeField(form) {
    var timeEl = form.querySelector('input[name="time"]');
    if (!timeEl) return;
    var svc = form.querySelector("select.js-emailjs-service");
    var svcText = svc && svc.value ? svc.value.trim() : "";
    var stamp = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    timeEl.value = svcText ? svcText + " · " + stamp : stamp;
  }

  function resolveIds(form) {
    var d = form.dataset || {};
    var g = (typeof window !== "undefined" && window.APTIZIO_EMAILJS) || {};
    return {
      service: String(d.emailjsServiceId || g.serviceId || "").trim(),
      template: String(d.emailjsTemplateId || g.templateId || "").trim()
    };
  }

  function ensureEmailjsInit() {
    if (emailjsInitialized || typeof emailjs === "undefined") return;
    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailjsInitialized = true;
  }

  function openMailto(href) {
    var a = document.createElement("a");
    a.href = href;
    a.setAttribute("aria-hidden", "true");
    a.style.cssText = "position:fixed;left:-9999px;top:0;";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function submitViaMailto(form) {
    fillTimeField(form);
    var get = function (sel) {
      var el = form.querySelector(sel);
      return el && el.value ? String(el.value).trim() : "";
    };
    var name = get('[name="name"]');
    var email = get('[name="email"]');
    var title = get('[name="title"]');
    var message = get('[name="message"]');
    var time = get('[name="time"]');
    var body = ["Name: " + name, "Email: " + email, "Title: " + title, "Service / time: " + time, "", message].join("\n");
    var subject = "Aptizio contact: " + (title || name || "Website");
    var href =
      "mailto:" + MAILTO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    openMailto(href);
  }

  function bindForms() {
    document.querySelectorAll("form[data-emailjs-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var emailjsOk = typeof emailjs !== "undefined";
        var ids = resolveIds(form);
        var useEmailjs = emailjsOk && ids.service && ids.template;

        var btn = form.querySelector('button[type="submit"]');
        var orig = btn ? btn.innerHTML : "";
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = useEmailjs
            ? '<i class="fa-solid fa-spinner fa-spin"></i> Sending…'
            : '<i class="fa-solid fa-envelope"></i> Opening email…';
        }

        if (!useEmailjs) {
          if (inIframe()) {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = orig;
            }
            window.alert(
              "This preview runs inside the editor, so your system mail app cannot open safely.\n\n" +
                "Fix: open index.html in Chrome or Edge (double-click the file, or use Live Server), " +
                "or add your EmailJS Service ID and Template ID in js/emailjs-ids.js to send without mail."
            );
            return;
          }

          submitViaMailto(form);
          if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Continue in your email app';
            btn.style.background = "linear-gradient(135deg,#2a4a38,#3d6b50)";
            setTimeout(function () {
              btn.innerHTML = orig;
              btn.style.background = "";
              btn.disabled = false;
              form.reset();
            }, 2500);
          }
          return;
        }

        ensureEmailjsInit();
        fillTimeField(form);

        emailjs
          .sendForm(ids.service, ids.template, form)
          .then(function () {
            if (btn) {
              btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Message Sent!';
              btn.style.background = "linear-gradient(135deg,#2a4a38,#3d6b50)";
            }
            form.reset();
            setTimeout(function () {
              if (btn) {
                btn.innerHTML = orig;
                btn.style.background = "";
                btn.disabled = false;
              }
            }, 3000);
          })
          .catch(function (err) {
            console.error("EmailJS send failed:", err);
            if (btn) {
              btn.innerHTML = orig;
              btn.disabled = false;
            }
            window.alert("Could not send your message. Please try again or email us directly.");
          });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindForms);
  else bindForms();
})();
