import React from "react";
import "../style.css";

function Library({ contracts }) {
  console.log("Library affichée", contracts);
  return (
    <div style={{ marginLeft: "7px" }}>
      <h2>Bibliothèque de contrats</h2>
      <ul>
        {contracts.length ? (
          contracts.map((contract) => <li key={contract}>{contract}</li>)
        ) : (
          <li>Aucun contrat enregistré</li>
        )}
      </ul>
    </div>
  );
}

export default Library;
