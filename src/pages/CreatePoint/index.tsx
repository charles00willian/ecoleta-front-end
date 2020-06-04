import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './styles.css';
import { FiArrowLeft } from 'react-icons/fi';
import logo from '../../assets/logo.svg';
import { Link } from 'react-router-dom';
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';
import Axios from 'axios';
// import { Container } from './styles';

interface Item {
  id: number;
  name: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const CreatePoint: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [selectedUf, setSelecteUf] = useState('0')

  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('0')

  const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])
  const [selectedPosition, setSelectedPostion] = useState<[number, number]>([0,0])     

  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  })

  useEffect(()=>{
    api.get('items')
      .then(res => {
        setItems(res.data)
      })

    Axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then(res => {
        const ufInitials = res.data.map((e) => e.sigla);

        setUfs(ufInitials);
      })

    
  }, [])

  useEffect(()=> {
    if(selectedUf === '0'){
      return
    }
    Axios.get<IBGECityResponse[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
      )
      .then(res => {
        const cityNames = res.data.map((e) => e.nome);

        setCities(cityNames);
      })
  }, [selectedUf])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([latitude, longitude]);
    })
  })

  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>){
    const uf = event.target.value;
    setSelecteUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
    const city = event.target.value;
    setSelectedCity(city);
  }

  function handleMapClick(event: LeafletMouseEvent){
    setSelectedPostion(
      [event.latlng.lat, event.latlng.lng]
    )
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>){
    const {name, value} = event.target;
    setFormData({...formData, [name]: value})
  }

  function handleSelectItem(id: number){
    const alreadySelected = selectedItems.findIndex(item => item === id);
    
    if(alreadySelected >= 0){
      const filteredItems = selectedItems.filter(item => item !== id);
      setSelectedItems(filteredItems);
    }else{
      setSelectedItems([...selectedItems, id]);
    }
  }

  async function handleSubmit(event: FormEvent){
    event.preventDefault();

    const { name, email, whatsapp} = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    const data = {
      name,
      email,
      whatsapp,
      uf,
      city,
      latitude, 
      longitude,
      items
    }
    await api.post('points', data).catch(console.log);

    alert('Ponto de coleta cadastrado com sucesso')
  }

  return(
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>

        <Link to='/'>
          <FiArrowLeft/>
          Voltar para home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro do ponto de coleta</h1>
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nomde da entidade</label>
            <input type="text" name="name" id="name" onChange={handleInputChange}/>
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input type="text" name="email" id="email"onChange={handleInputChange} />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input type="text" name="whatsapp" id="whatsapp"onChange={handleInputChange}/>
            </div>
          </div>
        </fieldset>

        <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={selectedPosition} />
        </Map>
 
        <fieldset>
          <legend><h2>Endereço</h2><span>Selecione um endereço no mapa</span></legend>
          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select name="uf" id="uf" onChange={handleSelectUF} value={selectedUf}>
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => <option value={uf} key={uf}>{uf}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select name="city" id="city" onChange={handleSelectCity} value={selectedCity}>
                <option value="0">Selectione uma cidade</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Items de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map(item => 
              <li  
                key={item.id} 
                onClick={() => handleSelectItem(item.id)}  
                className={selectedItems.includes(item.id) ? 'selected' :''}
              >
                <img  src={item.image_url} alt={item.name}/>
                <span>{item.name}</span> 
              </li>)
            }
          </ul>
        </fieldset>
        <button type="submit">
          Cadastrar ponto de coleta
        </button>

      </form>

    </div>
  );
}

export default CreatePoint;