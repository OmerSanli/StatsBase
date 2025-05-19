<form className="input-group" onSubmit={handleSubmit}>
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Kullanıcı adı girin..."
  />
  <button type="submit">Ara</button>
</form>
