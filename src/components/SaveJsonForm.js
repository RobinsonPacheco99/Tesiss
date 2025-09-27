import React, { useState } from 'react';
import { guardarPreguntasEnFirestore } from '../firebase';

const SaveJsonForm = () => {
  const [jsonData, setJsonData] = useState('');
  const [fileName, setFileName] = useState('');
  const [jsonError, setJsonError] = useState('');

  const handleChange = (event) => {
    const value = event.target.value;
    setJsonData(value);
    setFileName('');
    try {
      JSON.parse(value);
      setJsonError('');
    } catch (e) {
      setJsonError('Formato JSON inválido');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonData(e.target.result);
        try {
          JSON.parse(e.target.result);
          setJsonError('');
        } catch (err) {
          setJsonError('Formato JSON inválido');
        }
      };
      reader.readAsText(file);
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (jsonError) {
      alert('Corrige el error antes de guardar: ' + jsonError);
      return;
    }
    try {
      const parsedData = JSON.parse(jsonData);
      await guardarPreguntasEnFirestore(parsedData);
      alert('Datos guardados con éxito en Firestore!');
      setJsonData('');
      setFileName('');
    } catch (error) {
      alert('Error al guardar los datos: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Selecciona un archivo JSON:
        <input type="file" accept="application/json" onChange={handleFileChange} />
      </label>
      {fileName && <div>Archivo seleccionado: {fileName}</div>}
      <br />
      <textarea
        value={jsonData}
        onChange={handleChange}
        placeholder="Ingresa tu JSON aquí o selecciona un archivo"
        rows="10"
        cols="50"
        style={{marginTop: '1em'}}
      />
      <br />
      {jsonError && <div style={{color: 'red', marginBottom: '1em'}}>{jsonError}</div>}
      <button type="submit" disabled={!!jsonError}>Guardar JSON</button>
    </form>
  );
};

export default SaveJsonForm;