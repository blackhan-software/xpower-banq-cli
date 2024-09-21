#compdef banq
# shellcheck disable=2207
###############################################################################

_BANQ_CACHE_DIR="/tmp/banq_cache"
_BANQ_CACHE_TTL=86400 # 24 hours

function _load {
    local file="$_BANQ_CACHE_DIR/${1//-/_}"
    local time=$(($(date +%s) - _BANQ_CACHE_TTL))
    if [[ -f "$file" ]]; then
        if [[ "$(stat -c %Y $file)" -gt "$time" ]]; then
            cat "$file"
        fi
    else
        return 1
    fi
}

function _memo {
    local file="$_BANQ_CACHE_DIR/${1//-/_}"
    mkdir -p "$_BANQ_CACHE_DIR"
    echo "$2" >"$file"
}

###############################################################################
###############################################################################

function _banq {
    local curr_0="${COMP_WORDS[$((COMP_CWORD - 0))]}"
    local curr_1="${COMP_WORDS[$((COMP_CWORD - 1))]}"
    local curr_2="${COMP_WORDS[$((COMP_CWORD - 2))]}"
    local word_1="${COMP_WORDS[1]}"
    local word_2="${COMP_WORDS[2]}"
    local sup_cmds sup_opts
    local sub_cmds sub_opts
    COMPREPLY=()
    ## memo: sup_cmds="$(banq --list-commands)"
    if ! sup_cmds=$(_load "sup_cmds"); then
        sup_cmds="$(banq --list-commands)"
        _memo "sup_cmds" "$sup_cmds"
    fi
    ## memo: sup_opts="$(banq --list-options)"
    if ! sup_opts=$(_load "sup_opts"); then
        sup_opts="$(banq --list-options)"
        _memo "sup_opts" "$sup_opts"
    fi
    if [[ -n ${word_1} ]] && [[ " ${sup_cmds[*]} " == *" ${word_1} "* ]]; then
        ## memo: sub_cmds="$(banq "${word_1}" --list-commands)"
        if ! sub_cmds=$(_load "sub_cmds_${word_1}"); then
            sub_cmds="$(banq "${word_1}" --list-commands)"
            _memo "sub_cmds_${word_1}" "$sub_cmds"
        fi
        if [[ -n ${word_2} ]] && [[ " ${sub_cmds[*]} " == *" ${word_2} "* ]]; then
            ## memo: sub_opts="$(banq "${word_1}" "${word_2}" --list-options)"
            if ! sub_opts=$(_load "sub_opts_${word_1}_${word_2}"); then
                sub_opts="$(banq "${word_1}" "${word_2}" --list-options)"
                _memo "sub_opts_${word_1}_${word_2}" "$sub_opts"
            fi
            if [ "${curr_1}" == "=" ]; then
                ## banq: command sub-command --option=+ [TAB]
                local sug_opts=($(compgen -W "${sub_opts}" -- "${curr_2}=${curr_0}"))
                for opt in "${sug_opts[@]}"; do
                    if [[ "$opt" =~ ([^=]+)=([^=]+) ]]; then
                        COMPREPLY+=("${BASH_REMATCH[2]}")
                    fi
                done
            elif [ "${curr_0}" == "=" ]; then
                ## banq: command sub-command --option=* [TAB]
                local sug_opts=($(compgen -W "${sub_opts}" -- "${curr_1}="))
                for opt in "${sug_opts[@]}"; do
                    if [[ "$opt" =~ ([^=]+)=([^=]+) ]]; then
                        COMPREPLY+=("${BASH_REMATCH[2]}")
                    fi
                done
            else
                ## banq: command sub-command * [TAB]
                COMPREPLY+=($(compgen -W "${sub_opts}" -- "${curr_0}"))
            fi
            return 0
        fi
        ## banq: command [TAB]
        ## memo: sub_cmds="$(banq "${word_1}" --list-commands)"
        if ! sub_cmds=$(_load "sub_cmds_${word_1}"); then
            sub_cmds="$(banq "${word_1}" --list-commands)"
            _memo "sub_cmds_${word_1}" "$sub_cmds"
        fi
        COMPREPLY+=($(compgen -W "${sub_cmds}" -- "${curr_0}"))
        ## memo: sub_opts="$(banq "${word_1}" --list-options)"
        if ! sub_opts=$(_load "sub_opts_${word_1}"); then
            sub_opts="$(banq "${word_1}" --list-options)"
            _memo "sub_opts_${word_1}" "$sub_opts"
        fi
        COMPREPLY+=($(compgen -W "${sub_opts}" -- "${curr_0}"))
        return 0
    fi
    ## banq: [TAB]
    COMPREPLY+=($(compgen -W "${sup_opts}" -- "${curr_0}"))
    COMPREPLY+=($(compgen -W "${sup_cmds}" -- "${curr_0}"))
    return 0
}

###############################################################################

if [ -n "$ZSH_VERSION" ]; then
    autoload bashcompinit
    bashcompinit
fi

complete -F _banq banq

###############################################################################
###############################################################################
