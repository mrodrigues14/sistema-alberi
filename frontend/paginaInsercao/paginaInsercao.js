
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

window.onload = function() {
    fetch('/templateMenu/template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;

            var link = document.createElement('link');
            link.href = '/templateMenu/styletemplate.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            var script = document.createElement('script');
            script.src = '/templateMenu/templateScript.js';
            script.onload = function() {
                loadAndDisplayUsername();
                handleEmpresa();
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });

    fetch('/insercao/dados')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const select = document.getElementById('seletorBanco');
            const campoOculto = document.querySelector('input[name="id_banco"]');

            data.forEach(banco => {
                const option = document.createElement('option');
                option.value = banco.IDBANCO;
                option.textContent = banco.NOME;
                select.appendChild(option);
            });

            const ultimaSelecao = localStorage.getItem('ultimaSelecaoBanco');
            if (ultimaSelecao) {
                select.value = ultimaSelecao;
                campoOculto.value = ultimaSelecao;
            } else {
                campoOculto.value = select.value;
            }

            select.addEventListener('change', function () {
                campoOculto.value = select.value;
                localStorage.setItem('ultimaSelecaoBanco', select.value);
            });
        })

        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
        });

    fetch('/insercao/ultimas-insercoes')
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('ultimasInsercoes');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            
            data.forEach(insercao => {
                let saldo = 0;
                const row = tbody.insertRow();
                row.insertCell().textContent = formatDate(insercao.DATA);
                row.insertCell().textContent = insercao.CATEGORIA;
                row.insertCell().textContent = insercao.DESCRICAO;
                row.insertCell().textContent = insercao.NOME_NO_EXTRATO;
                if(insercao.TIPO_DE_TRANSACAO == "ENTRADA"){
                    saldo+=insercao.VALOR;
                    row.insertCell().textContent = insercao.VALOR;
                    row.insertCell().textContent = "";
                }
                else{
                    saldo-=insercao.VALOR;
                    row.insertCell().textContent = "";
                    row.insertCell().textContent = insercao.VALOR;
                }
                row.insertCell().textContent = saldo;
                row.insertCell().textContent = insercao.NOME_BANCO;
            });
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
        });

    const nomeEmpresa = getStoredEmpresaName();
    console.log("Nome da empresa antes da requisição fetch:", nomeEmpresa);
    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campoOculto = document.querySelector('input[name="id_empresa"]');
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                } else {
                    console.error('Campo oculto id_empresa não encontrado');
                }
            } else {
                console.error('Dados da empresa não retornados ou vazios');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });

        fetch('/insercao/dados-categoria')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('seletorCategoria');
            const categorias = construirArvoreDeCategorias(data);
            adicionarCategoriasAoSelect(select, categorias);
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
        });
    
        
};
    
function construirArvoreDeCategorias(categorias) {
    let mapa = {};
    let arvore = [];

    categorias.forEach(categoria => {
        mapa[categoria.IDCATEGORIA] = {...categoria, subcategorias: []};
    });

    Object.values(mapa).forEach(categoria => {
        if (categoria.ID_CATEGORIA_PAI) {
            mapa[categoria.ID_CATEGORIA_PAI].subcategorias.push(categoria);
        } else {
            arvore.push(categoria);
        }
    });

    return arvore;
}

function adicionarCategoriasAoSelect(select, categorias, prefixo = '') {
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.IDCATEGORIA;
        option.textContent = prefixo + categoria.NOME;
        select.appendChild(option);

        if (categoria.subcategorias.length > 0) {
            adicionarCategoriasAoSelect(select, categoria.subcategorias, prefixo + '---');
        }
    });
}

    function abrirPopUp(){
    document.getElementById("popup").style.display = "block";
    document.getElementById("sobreposicao").style.display = "block";
}

function fecharPopUp(){
    document.getElementById("popup").style.display = "none";
    document.getElementById("sobreposicao").style.display = "none";
    location.reload();
}



function teste(){
    alert("teste");
}
function excelDateToJSDate(excelDate) {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const convertedDate = date.toISOString().split('T')[0];
    return convertedDate;
}

function mostrarPopupCarregamento() {
    document.getElementById('loadingPopup').style.display = 'block';
}

function fecharPopupCarregamento() {
    document.getElementById('loadingPopup').style.display = 'none';
}

function lerExcel() {
    var input = document.getElementById('excelFile');
    var reader = new FileReader();

    reader.onload = function () {
        var fileData = reader.result;
        var workbook = XLSX.read(fileData, { type: 'binary' });
        workbook.SheetNames.forEach(function (sheetName) {
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            XL_row_object.forEach(function (row) {
                if (row.Data && !isNaN(row.Data)) {
                    row.Data = excelDateToJSDate(row.Data);
                }
            });
            var json_object = JSON.stringify(XL_row_object);
            console.log("JSON Convertido:", json_object);

            mostrarPopupCarregamento();

            fetch('/insercao/inserir-lote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: json_object
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na resposta do servidor');
                    }
                    return response.text();
                })
                .then(data => {
                    fecharPopupCarregamento();
                    console.log(data);
                })
                .catch(error => {
                    fecharPopupCarregamento();
                    console.error('Falha ao enviar dados:', error);
                });
        });
    };

    reader.onerror = function (ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(input.files[0]);
}
