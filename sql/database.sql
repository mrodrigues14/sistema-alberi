create table if not exists banco
(
    IDBANCO int auto_increment
        primary key,
    NOME    varchar(100)                                                    not null,
    TIPO    enum ('CONTA CORRENTE', 'CONTA POUPANÇA', 'CONTA INVESTIMENTO') not null
);

create table if not exists categoria
(
    IDCATEGORIA      int auto_increment
        primary key,
    NOME             varchar(255) not null,
    ID_CATEGORIA_PAI int          null,
    constraint fk_categoria_pai
        foreign key (ID_CATEGORIA_PAI) references categoria (IDCATEGORIA)
            on delete set null on update cascade
);

create table if not exists cliente
(
    IDCLIENTE int auto_increment
        primary key,
    CNPJ      char(14)     null,
    CPF       char(11)     null,
    TELEFONE  char(11)     null,
    NOME      varchar(100) not null,
    constraint CPF
        unique (CPF, CNPJ, TELEFONE)
);

create table if not exists extrato
(
    IDEXTRATO         int auto_increment
        primary key,
    DATA              date                      not null,
    CATEGORIA         varchar(100)              not null,
    NOME_NO_EXTRATO   varchar(100)              not null,
    TIPO_DE_TRANSACAO enum ('ENTRADA', 'SAIDA') not null,
    VALOR             float(11, 2)              not null,
    ID_BANCO          int                       not null,
    ID_CLIENTE        int                       not null,
    DESCRICAO         varchar(255)              not null,
    constraint FK_CLIENTE
        foreign key (ID_CLIENTE) references cliente (IDCLIENTE)
            on delete cascade on update cascade,
    constraint FK_EXTRATO_2
        foreign key (ID_BANCO) references banco (IDBANCO)
            on delete cascade on update cascade
);

create table if not exists fornecedor
(
    IDFORNECEDOR    int auto_increment
        primary key,
    NOME            varchar(100) not null ,
    CNPJ            int          not null ,
    CPF             char(11)     not null ,
    TIPO_DE_PRODUTO varchar(100) not null
);

create table if not exists relacaoclientebanco
(
    ID_CLIENTE int null,
    ID_BANCO   int null,
    constraint relacaoclientebanco_ibfk_1
        foreign key (ID_CLIENTE) references cliente (IDCLIENTE)
            on delete cascade on update cascade,
    constraint relacaoclientebanco_ibfk_2
        foreign key (ID_BANCO) references banco (IDBANCO)
            on delete cascade on update cascade
);

create index ID_BANCO
    on relacaoclientebanco (ID_BANCO);

create index ID_CLIENTE
    on relacaoclientebanco (ID_CLIENTE);

create table if not exists relacaoclientecategoria
(
    ID_CLIENTE   int null,
    ID_CATEGORIA int null,
    constraint relacaoclientecategoria_ibfk_1
        foreign key (ID_CLIENTE) references cliente (IDCLIENTE)
            on delete cascade on update cascade,
    constraint relacaoclientecategoria_ibfk_2
        foreign key (ID_CATEGORIA) references categoria (IDCATEGORIA)
            on delete cascade on update cascade
);

create index ID_CATEGORIA
    on relacaoclientecategoria (ID_CATEGORIA);

create index ID_CLIENTE
    on relacaoclientecategoria (ID_CLIENTE);

create table if not exists relacaoclientefornecedor
(
    ID_FORNECEDOR int null,
    ID_CLIENTE    int null,
    constraint FK_E__Assoc__2_Relacao_2_1
        foreign key (ID_FORNECEDOR) references fornecedor (IDFORNECEDOR)
            on delete cascade on update cascade,
    constraint FK_E__Assoc__2_Relacao_2_2
        foreign key (ID_CLIENTE) references cliente (IDCLIENTE)
            on delete cascade on update cascade
);

create table if not exists tarefas
(
    IDTAREFA    int auto_increment
        primary key,
    TITULO      varchar(255)                                       not null,
    DATA_LIMITE date                                               not null,
    ID_CLIENTE  int                                                null,
    STATUS      enum ('CONCLUÍDO', 'PENDENTE', 'NÃO FOI INICIADO') not null,
    constraint tarefas_ibfk_1
        foreign key (ID_CLIENTE) references cliente (IDCLIENTE)
            on delete set null on update cascade
);

create index FK_TAREFAS
    on tarefas (ID_CLIENTE);

create table if not exists usuarios
(
    IDUSUARIOS      int auto_increment
        primary key,
    NOME_DO_USUARIO varchar(100) null,
    SENHA           varchar(60)  not null,
    ROLE            varchar(30)  not null,
    USUARIO_LOGIN   varchar(100) null
);


