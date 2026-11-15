import { useRef, useState } from "react";
import { validateAll } from "./validate.js";

/**
 * State formulir kecil dengan validasi inline:
 * - field yang belum disentuh tidak pernah ditandai salah saat diketik;
 * - validasi berjalan saat field ditinggalkan (blur) dan saat submit;
 * - pesan galat hilang begitu field difokus atau diketik ulang;
 * - submit tidak pernah dimatikan; bila ada galat, fokus pindah ke field pertama yang salah.
 *
 * @param {Record<string, any>} initialValues
 * @param {Record<string, (value: any) => string>} rules
 */
export function useForm(initialValues, rules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  function clearError(name) {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function field(name) {
    return {
      name,
      value: values[name],
      error: errors[name],
      onChange: (e) => {
        const value = e.target.value;
        setValues((prev) => ({ ...prev, [name]: value }));
        clearError(name);
      },
      onFocus: () => clearError(name),
      onBlur: (e) => {
        const rule = rules[name];
        const message = rule ? rule(e.target.value) : "";
        if (message) setErrors((prev) => ({ ...prev, [name]: message }));
      }
    };
  }

  /** Memvalidasi semua field; mengembalikan true bila valid. */
  function validate() {
    const found = validateAll(rules, values);
    setErrors(found);
    const first = Object.keys(rules).find((name) => found[name]);
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus({ preventScroll: false });
      // Fokus memicu onFocus yang menghapus galat; pasang ulang setelahnya.
      setErrors(found);
      return false;
    }
    return true;
  }

  /** Menandai satu field salah dari luar (mis. pesan 400 dari server). */
  function setFieldError(name, message) {
    setErrors((prev) => ({ ...prev, [name]: message }));
  }

  function reset(next = initialValues) {
    setValues(next);
    setErrors({});
  }

  return { values, errors, field, validate, setFieldError, reset, formRef };
}
