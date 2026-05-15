export function isFormField(element) {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
}

export function isRequiredFieldEmpty(field) {
  if (!field.required || field.disabled) {
    return false;
  }
  if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) {
    return !field.checked;
  }
  return !String(field.value ?? "").trim();
}

function setFieldValidationState(field, invalid) {
  field.classList.toggle("is-invalid", invalid);
  field.setAttribute("aria-invalid", invalid ? "true" : "false");
  const fieldGroup = field.closest(".field-group");
  if (fieldGroup) {
    fieldGroup.classList.toggle("has-error", invalid);
    let errorEl = fieldGroup.querySelector(".field-error");
    if (invalid) {
      if (!errorEl) {
        errorEl = document.createElement("span");
        errorEl.className = "field-error";
        fieldGroup.appendChild(errorEl);
      }
      errorEl.textContent = "请填写此项";
    } else if (errorEl) {
      errorEl.remove();
    }
  }
}

export function clearFieldValidationState(field) {
  if (!field.classList.contains("is-invalid")) {
    return;
  }
  if (!field.required) {
    setFieldValidationState(field, false);
    return;
  }
  if (!isRequiredFieldEmpty(field)) {
    setFieldValidationState(field, false);
  }
}

export function validateRequiredFields(form) {
  let firstInvalidField = null;

  form.querySelectorAll("[required]").forEach((element) => {
    if (!isFormField(element)) {
      return;
    }
    const invalid = isRequiredFieldEmpty(element);
    setFieldValidationState(element, invalid);
    if (invalid && !firstInvalidField) {
      firstInvalidField = element;
    }
  });

  if (firstInvalidField) {
    firstInvalidField.focus();
    return false;
  }

  return true;
}

export function getNamedFormField(form, fieldName) {
  const field = form.elements.namedItem(fieldName);
  return isFormField(field) ? field : null;
}

export function markFormFieldInvalid(form, fieldName) {
  const field = getNamedFormField(form, fieldName);
  if (!field) {
    return;
  }
  setFieldValidationState(field, true);
  field.focus();
}
